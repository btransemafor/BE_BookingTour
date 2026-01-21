const express = require("express");
const pool = require("../config/database");
const router = express.Router();

// GET: Lấy thông tin tour theo schedule_id (đầy đủ tour, lịch trình, location, category, images, days, amenities)
router.get("/:schedule_id/tour", async (req, res) => {
  try {
    const { schedule_id } = req.params;
    // 1. Lấy schedule + tour
    const scheduleRes = await pool.query(
      `SELECT ts.*, t.*, l.name as location_name, l.slug as location_slug, c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM tour_schedules ts
       JOIN tours t ON ts.tour_id = t.id
       LEFT JOIN locations l ON t.location_id = l.id
       LEFT JOIN tour_categories c ON t.category_id = c.id
       WHERE ts.id = $1`,
      [schedule_id]
    );
    if (scheduleRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Schedule or tour not found" });
    }
    const row = scheduleRes.rows[0];

    // 2. Lấy images
    const imagesRes = await pool.query(
      `SELECT image_url, alt_text, is_cover, display_order FROM tour_images WHERE tour_id = $1 ORDER BY is_cover DESC, display_order ASC`,
      [row.tour_id]
    );
    // 3. Lấy days + places
    const daysRes = await pool.query(
      `SELECT id, day_number, title, description, accommodation, meals FROM tour_days WHERE tour_id = $1 ORDER BY day_number ASC`,
      [row.tour_id]
    );
    const itinerary = await Promise.all(
      daysRes.rows.map(async (day) => {
        const placesRes = await pool.query(
          `SELECT dp.visit_order, dp.duration_minutes, dp.notes, p.id as place_id, p.name, p.slug, p.address, p.latitude, p.longitude, p.image_url, p.type, p.rating
           FROM day_places dp JOIN places p ON dp.place_id = p.id WHERE dp.tour_day_id = $1 ORDER BY dp.visit_order ASC`,
          [day.id]
        );
        return {
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          accommodation: day.accommodation,
          meals: day.meals,
          places: placesRes.rows.map(p => ({
            id: p.place_id,
            name: p.name,
            slug: p.slug,
            address: p.address,
            latitude: p.latitude ? parseFloat(p.latitude) : null,
            longitude: p.longitude ? parseFloat(p.longitude) : null,
            image_url: p.image_url,
            type: p.type,
            rating: p.rating ? parseFloat(p.rating) : null,
            visit_order: p.visit_order,
            duration_minutes: p.duration_minutes,
            notes: p.notes
          }))
        };
      })
    );
    // 4. Lấy amenities
    const amenitiesRes = await pool.query(
      `SELECT ta.amenity_id, a.name, a.slug, a.icon, a.category, ta.price, ta.is_included, ta.is_optional
       FROM tour_amenities ta JOIN amenities a ON ta.amenity_id = a.id WHERE ta.tour_id = $1 ORDER BY a.category, a.name`,
      [row.tour_id]
    );
    // 5. Build response
    res.json({
      success: true,
      data: {
        schedule: {
          id: row.id,
          tour_id: row.tour_id,
          start_date: row.start_date,
          end_date: row.end_date,
          price_override: row.price_override,
          available_slots: row.available_slots,
          booked_slots: row.booked_slots,
          status: row.status,
          notes: row.notes
        },
        tour: {
          id: row.tour_id,
          name: row.name,
          slug: row.slug,
          short_description: row.short_description,
          description: row.description,
          highlights: row.highlights,
          included_services: row.included_services,
          excluded_services: row.excluded_services,
          terms_conditions: row.terms_conditions,
          cancellation_policy: row.cancellation_policy,
          duration_days: row.duration_days,
          duration_nights: row.duration_nights,
          base_price: row.base_price,
          child_price: row.child_price,
          infant_price: row.infant_price,
          max_participants: row.max_participants,
          min_participants: row.min_participants,
          difficulty: row.difficulty,
          transportation_type: row.transportation_type,
          departure_location: row.departure_location,
          return_location: row.return_location,
          view_count: row.view_count,
          booking_count: row.booking_count,
          rating: row.rating,
          review_count: row.review_count,
          status: row.status,
          is_featured: row.is_featured,
          is_hot_deal: row.is_hot_deal,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        location: row.location_id ? {
          id: row.location_id,
          name: row.location_name,
          slug: row.location_slug
        } : null,
        category: row.category_id ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          icon: row.category_icon
        } : null,
        images: imagesRes.rows,
        itinerary,
        amenities: amenitiesRes.rows
      }
    });
  } catch (error) {
    console.error('Get tour by schedule error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tour by schedule', error: error.message });
  }
});

// ...CRUD khác giữ nguyên...

module.exports = router;
