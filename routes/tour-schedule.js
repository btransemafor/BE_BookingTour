const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL TOUR SCHEDULES
router.get('/', async (req, res) => {
  try {
    const tourId = req.query.tourId;
    const status = req.query.status;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    let query = `SELECT 
      ts.ScheduleID,
      ts.TourID,
      ts.DepartureDate,
      ts.Status,
      ts.AvailableSlots,
      tg.GuideID,
      tg.FullName as GuideName,
      tg.Email as GuideEmail,
      tg.PhoneNumber as GuidePhone,
      tg.Languages as GuideLanguages,
      tg.ExperienceYears,
      COUNT(DISTINCT b.BookingID) as booking_count,
      COALESCE(SUM(b.NumberOfPeople), 0) as people_booked
     FROM TOUR_SCHEDULE ts
     LEFT JOIN TOUR_GUIDE tg ON ts.GuideID = tg.GuideID
     LEFT JOIN BOOKING b ON ts.ScheduleID = b.ScheduleID AND b.Status != 'CANCELLED'
     WHERE 1=1`;

    let params = [];
    let paramIndex = 1;

    if (tourId) {
      query += ` AND ts.TourID = $${paramIndex}`;
      params.push(tourId);
      paramIndex++;
    }
    if (status) {
      query += ` AND ts.Status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` GROUP BY ts.ScheduleID, tg.GuideID
     ORDER BY ts.DepartureDate ASC
     LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        scheduleId: row.scheduleid,
        tourId: row.tourid,
        departureDate: row.departuredate,
        status: row.status,
        availableSlots: row.availableslots,
        bookingsCount: parseInt(row.booking_count),
        peopleBooked: parseInt(row.people_booked),
        slotsRemaining: Math.max(0, row.availableslots - row.people_booked),
        guide: row.guideid ? {
          guideId: row.guideid,
          name: row.guidename,
          email: row.guideemail,
          phone: row.guidephone,
          languages: row.guidelanguages,
          experienceYears: row.experienceyears
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching schedules', 
      error: error.message 
    });
  }
});

// GET SCHEDULE BY ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ts.ScheduleID,
        ts.TourID,
        t.TourName,
        ts.DepartureDate,
        ts.Status,
        ts.AvailableSlots,
        tg.GuideID,
        tg.FullName as GuideName,
        tg.Email as GuideEmail,
        tg.PhoneNumber as GuidePhone,
        tg.Languages as GuideLanguages,
        tg.ExperienceYears,
        COUNT(DISTINCT b.BookingID) as booking_count,
        COALESCE(SUM(b.NumberOfPeople), 0) as people_booked
       FROM TOUR_SCHEDULE ts
       JOIN TOUR t ON ts.TourID = t.TourID
       LEFT JOIN TOUR_GUIDE tg ON ts.GuideID = tg.GuideID
       LEFT JOIN BOOKING b ON ts.ScheduleID = b.ScheduleID AND b.Status != 'CANCELLED'
       WHERE ts.ScheduleID = $1
       GROUP BY ts.ScheduleID, t.TourName, tg.GuideID`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        scheduleId: row.scheduleid,
        tourId: row.tourid,
        tourName: row.tourname,
        departureDate: row.departuredate,
        status: row.status,
        availableSlots: row.availableslots,
        bookingsCount: parseInt(row.booking_count),
        peopleBooked: parseInt(row.people_booked),
        slotsRemaining: Math.max(0, row.availableslots - row.people_booked),
        guide: row.guideid ? {
          guideId: row.guideid,
          name: row.guidename,
          email: row.guideemail,
          phone: row.guidephone,
          languages: row.guidelanguages,
          experienceYears: row.experienceyears
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching schedule', 
      error: error.message 
    });
  }
});

// CREATE SCHEDULE (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { tourId, departureDate, guideId, availableSlots, status } = req.body;

    if (!tourId || !departureDate || !availableSlots) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID, Departure Date, and Available Slots are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO TOUR_SCHEDULE (TourID, DepartureDate, GuideID, AvailableSlots, Status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tourId, departureDate, guideId || null, availableSlots, status || 'OPEN']
    );

    res.status(201).json({
      success: true,
      data: {
        scheduleId: result.rows[0].scheduleid,
        tourId: result.rows[0].tourid,
        departureDate: result.rows[0].departuredate,
        guideId: result.rows[0].guideid,
        availableSlots: result.rows[0].availableslots,
        status: result.rows[0].status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating schedule', 
      error: error.message 
    });
  }
});

// UPDATE SCHEDULE (ADMIN)
router.put('/:id', async (req, res) => {
  try {
    const { departureDate, guideId, availableSlots, status } = req.body;

    const result = await pool.query(
      `UPDATE TOUR_SCHEDULE
       SET DepartureDate = COALESCE($1, DepartureDate),
           GuideID = COALESCE($2, GuideID),
           AvailableSlots = COALESCE($3, AvailableSlots),
           Status = COALESCE($4, Status)
       WHERE ScheduleID = $5
       RETURNING *`,
      [departureDate || null, guideId || null, availableSlots || null, status || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    res.json({
      success: true,
      data: {
        scheduleId: result.rows[0].scheduleid,
        tourId: result.rows[0].tourid,
        departureDate: result.rows[0].departuredate,
        guideId: result.rows[0].guideid,
        availableSlots: result.rows[0].availableslots,
        status: result.rows[0].status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating schedule', 
      error: error.message 
    });
  }
});

// DELETE SCHEDULE (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM TOUR_SCHEDULE WHERE ScheduleID = $1 RETURNING ScheduleID',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Schedule not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting schedule', 
      error: error.message 
    });
  }
});

module.exports = router;
