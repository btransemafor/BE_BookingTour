const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL IMAGES FOR A TOUR
router.get('/tour/:tourId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ImageID,
        TourID,
        ImageUrl,
        IsCover,
        CreatedAt
       FROM TOUR_IMAGE
       WHERE TourID = $1
       ORDER BY IsCover DESC, CreatedAt DESC`,
      [req.params.tourId]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        imageId: row.imageid,
        tourId: row.tourid,
        imageUrl: row.imageurl,
        isCover: row.iscover,
        createdAt: row.createdat
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tour images', 
      error: error.message 
    });
  }
});

// GET COVER IMAGE FOR A TOUR
router.get('/tour/:tourId/cover', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ImageUrl FROM TOUR_IMAGE
       WHERE TourID = $1 AND IsCover = TRUE
       LIMIT 1`,
      [req.params.tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No cover image found' 
      });
    }

    res.json({
      success: true,
      data: {
        imageUrl: result.rows[0].imageurl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cover image', 
      error: error.message 
    });
  }
});

// GET IMAGE BY ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM TOUR_IMAGE
       WHERE ImageID = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    res.json({
      success: true,
      data: {
        imageId: result.rows[0].imageid,
        tourId: result.rows[0].tourid,
        imageUrl: result.rows[0].imageurl,
        isCover: result.rows[0].iscover,
        createdAt: result.rows[0].createdat
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching image', 
      error: error.message 
    });
  }
});

// ADD IMAGE TO TOUR
router.post('/', async (req, res) => {
  try {
    const { tourId, imageUrl, isCover } = req.body;

    if (!tourId || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tour ID and Image URL are required' 
      });
    }

    // If this is a cover image, remove cover status from other images
    if (isCover) {
      await pool.query(
        `UPDATE TOUR_IMAGE
         SET IsCover = FALSE
         WHERE TourID = $1`,
        [tourId]
      );
    }

    const result = await pool.query(
      `INSERT INTO TOUR_IMAGE (TourID, ImageUrl, IsCover)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tourId, imageUrl, isCover || false]
    );

    res.status(201).json({
      success: true,
      data: {
        imageId: result.rows[0].imageid,
        tourId: result.rows[0].tourid,
        imageUrl: result.rows[0].imageurl,
        isCover: result.rows[0].iscover,
        createdAt: result.rows[0].createdat
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error adding image', 
      error: error.message 
    });
  }
});

// UPDATE IMAGE (Set as cover or update URL)
router.put('/:id', async (req, res) => {
  try {
    const { imageUrl, isCover } = req.body;

    // Get tour ID first
    const imageResult = await pool.query(
      'SELECT TourID FROM TOUR_IMAGE WHERE ImageID = $1',
      [req.params.id]
    );

    if (imageResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    const tourId = imageResult.rows[0].tourid;

    // If setting as cover, remove cover from others
    if (isCover) {
      await pool.query(
        `UPDATE TOUR_IMAGE
         SET IsCover = FALSE
         WHERE TourID = $1`,
        [tourId]
      );
    }

    const result = await pool.query(
      `UPDATE TOUR_IMAGE
       SET ImageUrl = COALESCE($1, ImageUrl),
           IsCover = COALESCE($2, IsCover)
       WHERE ImageID = $3
       RETURNING *`,
      [imageUrl || null, isCover !== undefined ? isCover : null, req.params.id]
    );

    res.json({
      success: true,
      data: {
        imageId: result.rows[0].imageid,
        tourId: result.rows[0].tourid,
        imageUrl: result.rows[0].imageurl,
        isCover: result.rows[0].iscover,
        createdAt: result.rows[0].createdat
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating image', 
      error: error.message 
    });
  }
});

// DELETE IMAGE
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM TOUR_IMAGE WHERE ImageID = $1 RETURNING ImageID',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting image', 
      error: error.message 
    });
  }
});

module.exports = router;
