const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL DESTINATIONS WITH TOUR COUNT
router.get('/', async (req, res) => {
  try {
    const featured = req.query.featured === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    let query = `SELECT 
      d.DestinationID,
      d.Name,
      d.Description,
      d.DestinationType,
      d.City,
      d.Country,
      d.Latitude,
      d.Longitude,
      d.ImageUrl,
      COUNT(DISTINCT td.TourID) as tour_count
     FROM DESTINATION d
     LEFT JOIN TOUR_DESTINATION td ON d.DestinationID = td.DestinationID
     `;

    let params = [];

    if (featured) {
      query += `WHERE d.ImageUrl IS NOT NULL `;
    }

    query += `GROUP BY d.DestinationID
     ORDER BY d.Name`;

    if (limit) {
      query += ` LIMIT $${featured ? 1 : 0}`;
      if (featured) params.push(limit);
    }

    const result = await pool.query(query, params.length > 0 ? params : undefined);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.destinationid,
        name: row.name,
        description: row.description,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl,
        toursCount: parseInt(row.tour_count)
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

// GET DESTINATION BY ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.DestinationID,
        d.Name,
        d.Description,
        d.DestinationType,
        d.City,
        d.Country,
        d.Latitude,
        d.Longitude,
        d.ImageUrl,
        COUNT(DISTINCT td.TourID) as tour_count
       FROM DESTINATION d
       LEFT JOIN TOUR_DESTINATION td ON d.DestinationID = td.DestinationID
       WHERE d.DestinationID = $1
       GROUP BY d.DestinationID`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Destination not found' 
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.destinationid,
        name: row.name,
        description: row.description,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl,
        toursCount: parseInt(row.tour_count)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching destination', 
      error: error.message 
    });
  }
});

// CREATE DESTINATION
router.post('/', async (req, res) => {
  try {
    const { name, description, destinationType, city, country, latitude, longitude, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Destination name is required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO DESTINATION (Name, Description, DestinationType, City, Country, Latitude, Longitude, ImageUrl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description || null, destinationType || null, city || null, country || null, latitude || null, longitude || null, imageUrl || null]
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        id: row.destinationid,
        name: row.name,
        description: row.description,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating destination', 
      error: error.message 
    });
  }
});

// UPDATE DESTINATION
router.put('/:id', async (req, res) => {
  try {
    const { name, description, destinationType, city, country, latitude, longitude, imageUrl } = req.body;

    const result = await pool.query(
      `UPDATE DESTINATION
       SET Name = COALESCE($1, Name),
           Description = COALESCE($2, Description),
           DestinationType = COALESCE($3, DestinationType),
           City = COALESCE($4, City),
           Country = COALESCE($5, Country),
           Latitude = COALESCE($6, Latitude),
           Longitude = COALESCE($7, Longitude),
           ImageUrl = COALESCE($8, ImageUrl)
       WHERE DestinationID = $9
       RETURNING *`,
      [name || null, description || null, destinationType || null, city || null, country || null, latitude || null, longitude || null, imageUrl || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Destination not found' 
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.destinationid,
        name: row.name,
        description: row.description,
        type: row.destinationtype,
        city: row.city,
        country: row.country,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.imageurl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating destination', 
      error: error.message 
    });
  }
});

// DELETE DESTINATION
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM DESTINATION WHERE DestinationID = $1 RETURNING DestinationID',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Destination not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Destination deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting destination', 
      error: error.message 
    });
  }
});

module.exports = router;
