const express = require("express");
const pool = require("../config/database");
const router = express.Router();
const { generateOrderId } = require("../utils/order.utils");
// POST: Create a new booking
router.post("/", async (req, res) => {
  try {
    const {
      tour_id,
      schedule_id,
      user_id,
      contact_name,
      contact_phone,
      contact_email,
      adult_quantity,
      child_quantity = 0,
      infant_quantity = 0,
      special_requests,
      discount_amount = 0,
    } = req.body;


    // Validate required fields
    if (
      !tour_id ||
      !schedule_id ||
      !user_id ||
      !contact_name ||
      !contact_phone ||
      !contact_email ||
      !adult_quantity
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const total_participants =
      Number(adult_quantity) + Number(child_quantity) + Number(infant_quantity);
    if (total_participants < 1) {
      return res.status(400).json({
        success: false,
        message: "Total participants must be at least 1",
      });
    }


    // 1. Get tour & schedule info
    const tourSql = `SELECT t.*, l.name as location_name, ts.* FROM tours t JOIN tour_schedules ts ON t.id = ts.tour_id JOIN locations l ON t.location_id = l.id WHERE t.id = $1 AND ts.id = $2 AND ts.status = 'OPEN'`;
    const tourResult = await pool.query(tourSql, [tour_id, schedule_id]);
    if (tourResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tour or schedule not found or not open",
      });
    }
    const tour = tourResult.rows[0];


    // 2. Check available slots
    const slots_left = tour.available_slots - tour.booked_slots;
    if (slots_left < total_participants) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough available slots" });
    }


    // 3. Calculate price
    const base_price = parseFloat(tour.base_price);
    const child_price = parseFloat(tour.child_price) || 0;
    const infant_price = parseFloat(tour.infant_price) || 0;
    const price_at_booking = tour.price_override
      ? parseFloat(tour.price_override)
      : base_price;
    const subtotal =
      adult_quantity * price_at_booking +
      child_quantity * child_price +
      infant_quantity * infant_price;
    const total_price = subtotal - discount_amount;


    // 4. Generate order_code
    const order_code = "ORD-" + Date.now() + Math.floor(Math.random() * 1000);


    // 5. Insert booking
    const insertSql = `INSERT INTO orders (
      order_code, user_id, tour_id, schedule_id,
      tour_name, location_name, start_date, end_date,
      price_at_booking, adult_quantity, child_quantity, infant_quantity, total_participants,
      contact_name, contact_phone, contact_email, special_requests,
      subtotal, discount_amount, total_price,
      status, payment_status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    RETURNING *`;
    const bookingParams = [
      order_code,
      user_id,
      tour_id,
      schedule_id,
      tour.name,
      tour.location_name,
      tour.start_date,
      tour.end_date,
      price_at_booking,
      adult_quantity,
      child_quantity,
      infant_quantity,
      total_participants,
      contact_name,
      contact_phone,
      contact_email,
      special_requests || null,
      subtotal,
      discount_amount,
      total_price,
      "PENDING",
      "UNPAID",
    ];
    const bookingResult = await pool.query(insertSql, bookingParams);
    const booking = bookingResult.rows[0];


    // 6. Update booked_slots
    await pool.query(
      "UPDATE tour_schedules SET booked_slots = booked_slots + $1 WHERE id = $2",
      [total_participants, schedule_id],
    );


    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.message,
    });
  }
});


// POST: Create booking with participants (with transaction rollback)
router.post("/with-participants", async (req, res) => {
  const client = await pool.connect(); // Get a client from the pool


  try {
    // Start transaction
    await client.query("BEGIN");


    const {
      tour_id,
      schedule_id,
      user_id,
      contact_name,
      contact_phone,
      contact_email,
      adult_quantity,
      child_quantity = 0,
      infant_quantity = 0,
      special_requests,
      discount_amount = 0,
      note,
      amenities = [],
      coupon_code,
      participants = [],
      payment_method,
    } = req.body;


    // ========== VALIDATION ==========
    if (
      !tour_id ||
      !schedule_id ||
      !user_id ||
      !contact_name ||
      !contact_phone ||
      !contact_email ||
      !adult_quantity
    ) {
      throw new Error("Missing required fields");
    }


    const total_participants =
      Number(adult_quantity) + Number(child_quantity) + Number(infant_quantity);


    if (total_participants < 1) {
      throw new Error("Total participants must be at least 1");
    }


    if (
      !Array.isArray(participants) ||
      participants.length !== total_participants
    ) {
      throw new Error("Participants info must match total participants");
    }


    // ========== 1. GET TOUR & SCHEDULE INFO ==========
    const tourSql = `
      SELECT t.*, l.name as location_name, ts.*
      FROM tours t
      JOIN tour_schedules ts ON t.id = ts.tour_id
      JOIN locations l ON t.location_id = l.id
      WHERE t.id = $1 AND ts.id = $2 AND ts.status = 'OPEN'
      FOR UPDATE  -- Lock the row to prevent race conditions
    `;
    const tourResult = await client.query(tourSql, [tour_id, schedule_id]);


    if (tourResult.rows.length === 0) {
      throw new Error("Tour or schedule not found or not open");
    }
    const tour = tourResult.rows[0];


    // ========== 2. CHECK AVAILABLE SLOTS ==========
    const slots_left =  tour.total_participants - tour.booked_slots;
    if (tour.available_slots < total_participants) {
      throw new Error(
        `Tour hiện chỉ còn ${slots_left} chỗ trống. Vui lòng chọn số lượng phù hợp.`,
      );
    }


    // ========== 3. CALCULATE PRICE ==========
    const base_price = parseFloat(tour.base_price);
    const child_price = parseFloat(tour.child_price) || 0;
    const infant_price = parseFloat(tour.infant_price) || 0;
    const price_at_booking = tour.price_override
      ? parseFloat(tour.price_override)
      : base_price;


    const subtotal =
      adult_quantity * price_at_booking +
      child_quantity * child_price +
      infant_quantity * infant_price;


    let amenities_total = 0;
    amenities.forEach((a) => {
      amenities_total += (a.price_at_booking || 0) * (a.quantity || 1);
    });


    // ========== 4. VALIDATE & APPLY COUPON ==========
    let discount_code_id = null;
    let discount_code_discount = 0;


    if (coupon_code) {
      const codeRes = await client.query(
        `SELECT * FROM discount_codes
         WHERE code = $1
         AND is_active = TRUE
         AND valid_from <= CURRENT_TIMESTAMP
         AND valid_to >= CURRENT_TIMESTAMP
         FOR UPDATE`, // Lock to prevent concurrent usage
        [coupon_code],
      );


      if (codeRes.rows.length > 0) {
        const discount = codeRes.rows[0];


          // Check usage limit (max_uses, used_count)
          if (
            discount.max_uses !== null &&
            typeof discount.max_uses === "number" &&
            discount.used_count >= discount.max_uses
          ) {
            throw new Error("Coupon has reached usage limit");
          }


          // Check per-user usage
          if (discount.max_uses_per_user && discount.max_uses_per_user > 0) {
            const userUsageRes = await client.query(
              `SELECT COUNT(*) FROM discount_code_usages WHERE discount_code_id = $1 AND user_id = $2`,
              [discount.id, user_id]
            );
            const userUsedCount = parseInt(userUsageRes.rows[0].count, 10);
            if (userUsedCount >= discount.max_uses_per_user) {
              throw new Error("Bạn đã sử dụng mã này đủ số lần cho phép");
            }
          }


          discount_code_id = discount.id;


          if (discount.discount_type === "PERCENTAGE") {
            discount_code_discount = Math.min(
              subtotal * (discount.discount_value / 100),
              discount.max_discount_amount || subtotal,
            );
          } else {
            discount_code_discount = Math.min(
              discount.discount_value,
              discount.max_discount_amount || discount.discount_value,
            );
          }


          // Increment used_count
          await client.query(
            `UPDATE discount_codes SET used_count = used_count + 1 WHERE id = $1`,
            [discount_code_id],
          );


          // Ghi nhận vào discount_code_usages
          await client.query(
            `INSERT INTO discount_code_usages (discount_code_id, user_id, order_id, discount_amount) VALUES ($1, $2, NULL, $3)`,
            [discount_code_id, user_id, discount_code_discount]
          );
      } else {
        throw new Error("Invalid or expired coupon code");
      }
    }


    const subtotal_all = subtotal + amenities_total;
    const total_discount = discount_amount + discount_code_discount;
    const total_price = Math.max(0, subtotal_all - total_discount);


    // ========== 5. GENERATE ORDER CODE ==========
    const order_code = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;


    // ========== 6. INSERT BOOKING ==========
    const insertSql = `
      INSERT INTO orders (
        order_code, user_id, tour_id, schedule_id,
        tour_name, location_name, start_date, end_date,
        price_at_booking, adult_quantity, child_quantity, infant_quantity, total_participants,
        contact_name, contact_phone, contact_email, special_requests,
        subtotal, discount_amount, total_price,
        status, payment_status, note, payment_method
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *
    `;


    const bookingParams = [
      order_code,
      user_id,
      tour_id,
      schedule_id,
      tour.name,
      tour.location_name,
      tour.start_date,
      tour.end_date,
      price_at_booking,
      adult_quantity,
      child_quantity,
      infant_quantity,
      total_participants,
      contact_name,
      contact_phone,
      contact_email,
      special_requests || null,
      subtotal_all,
      total_discount,
      total_price,
      "PENDING",
      "UNPAID",
      note || null,
      payment_method,
    ];


    const bookingResult = await client.query(insertSql, bookingParams);
    const booking = bookingResult.rows[0];


    // ========== 7. GET & INSERT AMENITIES ==========
    const resultAmenitiesByTourSQL = await client.query(
      `SELECT a.id as amenity_id, a.name, tr_a.price
       FROM tour_amenities tr_a
       JOIN amenities a ON tr_a.amenity_id = a.id
       WHERE tr_a.tour_id = $1`,
      [tour_id],
    );


    const amenitiesOfTour = resultAmenitiesByTourSQL.rows;


    for (const a of amenitiesOfTour) {
      await client.query(
        `INSERT INTO order_amenities (
          order_id, amenity_id, amenity_name, quantity, price_at_booking, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [booking.id, a.amenity_id, a.name, 1, a.price || 0, a.price || 0],
      );
    }


    // ========== 8. INSERT ORDER COUPON ==========
    if (discount_code_id && discount_code_discount > 0) {
      await client.query(
        `INSERT INTO order_coupons (order_id, discount_code_id, discount_amount)
         VALUES ($1, $2, $3)`,
        [booking.id, discount_code_id, discount_code_discount],
      );
    }


    // ========== 9. INSERT PARTICIPANTS ==========
    for (const p of participants) {
      await client.query(
        `INSERT INTO order_participants (
          order_id, full_name, participant_type, gender, date_of_birth,
          id_number, nationality, phone, email, special_notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          booking.id,
          p.full_name,
          p.participant_type,
          p.gender || null,
          p.date_of_birth || null,
          p.id_number || null,
          p.nationality || null,
          p.phone || null,
          p.email || null,
          p.special_notes || null,
        ],
      );
    }


    // ========== 10. UPDATE BOOKED SLOTS ==========
    const updateSlotsResult = await client.query(
      `UPDATE tour_schedules
       SET booked_slots = booked_slots + $1,
          available_slots = available_slots - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING booked_slots, available_slots`,
      [total_participants, schedule_id],
    );


    // Verify update was successful
    if (updateSlotsResult.rows.length === 0) {
      throw new Error("Failed to update tour schedule slots");
    }


    const updatedSlots = updateSlotsResult.rows[0];


    // Final check: ensure we didn't overbook
/*     if (updatedSlots.booked_slots > updatedSlots.available_slots) {
      throw new Error("Booking would exceed available slots");
    } */


    // ========== COMMIT TRANSACTION ==========
    await client.query("COMMIT");


    // Return success response
    res.status(201).json({
      success: true,
      data: {
        ...booking,
        remaining_slots:
          updatedSlots.available_slots - updatedSlots.booked_slots,
      },
      message: "Booking created successfully",
    });
  } catch (error) {
    // ========== ROLLBACK ON ERROR ==========
    await client.query("ROLLBACK");


    console.error("Booking error:", error);


    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = "Error creating booking with participants";


    if (error.message.includes("required fields")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (
      error.message.includes("not found") ||
      error.message.includes("Invalid")
    ) {
      statusCode = 404;
      errorMessage = error.message;
    } else if (
      error.message.includes("available slots") ||
      error.message.includes("usage limit")
    ) {
      statusCode = 409; // Conflict
      errorMessage = error.message;
    }


    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    // ========== RELEASE CLIENT ==========
    client.release();
  }
});


// ========== HELPER: Cancel/Refund Booking with Rollback ==========
router.post("/cancel/:bookingId", async (req, res) => {
  const client = await pool.connect();


  try {
    await client.query("BEGIN");


    const { bookingId } = req.params;
    const { reason } = req.body;


    // Get booking info
    const bookingResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [bookingId],
    );


    if (bookingResult.rows.length === 0) {
      throw new Error("Booking not found");
    }


    const booking = bookingResult.rows[0];


    if (booking.status === "CANCELLED") {
      throw new Error("Booking is already cancelled");
    }


    // Update booking status
    await client.query(
      `UPDATE orders
       SET status = 'CANCELLED',
           cancellation_reason = $1,
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || "User cancellation", bookingId],
    );


    // Restore booked slots
    await client.query(
      `UPDATE tour_schedules
       SET booked_slots = booked_slots - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [booking.total_participants, booking.schedule_id],
    );


    // If coupon was used, restore usage count
    const couponResult = await client.query(
      `SELECT discount_code_id FROM order_coupons WHERE order_id = $1`,
      [bookingId],
    );


    if (couponResult.rows.length > 0) {
      await client.query(
        `UPDATE discount_codes
         SET usage_count = GREATEST(0, usage_count - 1)
         WHERE id = $1`,
        [couponResult.rows[0].discount_code_id],
      );
    }


    await client.query("COMMIT");


    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: { bookingId, status: "CANCELLED" },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Cancel booking error:", error);


    res.status(500).json({
      success: false,
      message: error.message || "Error cancelling booking",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
});


module.exports = router;




