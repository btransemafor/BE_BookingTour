const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL TOUR DESTINATIONS
router.get('/', async (req, res) => {
  try {
    const tourId = req.query.tourId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    let query = `SELECT 
      td.TourID,
      td.DestinationID,
      td.VisitOrder,
      d.Name as DestinationName,
      d.Description as DestinationDescription,
      d.DestinationType,
      d.City,
      d.Country,
      d.Latitude,
      d.Longitude,
      d.ImageUrl
     FROM TOUR_DESTINATION td
     JOIN DESTINATION d ON td.DestinationID = d.DestinationID
     WHERE 1=1`;

    let params = [];
    let paramIndex = 1;

    if (tourId) {
      query += ` AND td.TourID = $${paramIndex}`;
      params.push(tourId);
      paramIndex++;
    }

    query += ` ORDER BY td.TourID, td.VisitOrder ASC
     LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        tourId: row.tourid,
        destinationId: row.destinationid,
        visitOrder: row.visitorder,
        name: row.destinationname,
        description: row.destinationdescription,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tour destinations', 
      error: error.message 
    });
  }
});

// GET DESTINATIONS BY TOUR ID
router.get('/tour/:tourId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        td.TourID,
        td.DestinationID,
        td.VisitOrder,
        d.Name as DestinationName,
        d.Description as DestinationDescription,
        d.DestinationType,
        d.City,
        d.Country,
        d.Latitude,
        d.Longitude,
        d.ImageUrl
       FROM TOUR_DESTINATION td
       JOIN DESTINATION d ON td.DestinationID = d.DestinationID
       WHERE td.TourID = $1
       ORDER BY td.VisitOrder ASC`,
      [req.params.tourId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        tourId: row.tourid,
        destinationId: row.destinationid,
        visitOrder: row.visitorder,
        name: row.destinationname,
        description: row.destinationdescription,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching destinations', 
      error: error.message 
    });
  }
});

// CREATE TOUR DESTINATION (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { tourId, destinationId, visitOrder } = req.body;

    if (!tourId || !destinationId || visitOrder === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID, Destination ID, and Visit Order are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO TOUR_DESTINATION (TourID, DestinationID, VisitOrder)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tourId, destinationId, visitOrder]
    );

    res.status(201).json({
      success: true,
      data: {
        tourId: result.rows[0].tourid,
        destinationId: result.rows[0].destinationid,
        visitOrder: result.rows[0].visitorder
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating tour destination', 
      error: error.message 
    });
  }
});

// UPDATE TOUR DESTINATION (ADMIN) - Change visit order
router.put('/', async (req, res) => {
  try {
    const { tourId, destinationId, visitOrder } = req.body;

    if (!tourId || !destinationId || visitOrder === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID, Destination ID, and Visit Order are required' 
      });
    }

    const result = await pool.query(
      `UPDATE TOUR_DESTINATION
       SET VisitOrder = $1
       WHERE TourID = $2 AND DestinationID = $3
       RETURNING *`,
      [visitOrder, tourId, destinationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tour destination not found' 
      });
    }

    res.json({
      success: true,
      data: {
        tourId: result.rows[0].tourid,
        destinationId: result.rows[0].destinationid,
        visitOrder: result.rows[0].visitorder
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating tour destination', 
      error: error.message 
    });
  }
});

// DELETE TOUR DESTINATION (ADMIN)
router.delete('/', async (req, res) => {
  try {
    const { tourId, destinationId } = req.body;

    if (!tourId || !destinationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID and Destination ID are required' 
      });
    }

    const result = await pool.query(
      'DELETE FROM TOUR_DESTINATION WHERE TourID = $1 AND DestinationID = $2 RETURNING TourID',
      [tourId, destinationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tour destination not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Tour destination deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting tour destination', 
      error: error.message 
    });
  }
});

module.exports = router;
