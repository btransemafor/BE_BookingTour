const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET ALL ACTIVE PROMOTIONS
router.get('/', async (req, res) => {
  try {
    const status = req.query.status || 'ACTIVE';
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    let query = `SELECT 
      PromotionCode,
      PromotionName,
      DiscountType,
      DiscountValue,
      MinimumOrderValue,
      StartDate,
      EndDate,
      UsageLimit,
      Status
     FROM PROMOTION
     WHERE Status = $1
     AND EndDate >= CURRENT_DATE
     ORDER BY EndDate ASC`;

    let params = [status];

    if (limit) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        code: row.promotioncode,
        name: row.promotionname,
        discountType: row.discounttype,
        discountValue: parseFloat(row.discountvalue),
        minimumOrderValue: row.minimumordervalue ? parseFloat(row.minimumordervalue) : null,
        startDate: row.startdate,
        endDate: row.enddate,
        usageLimit: row.usagelimit,
        status: row.status,
        isActive: new Date(row.enddate) >= new Date()
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching promotions', 
      error: error.message 
    });
  }
});

// GET PROMOTION BY CODE
router.get('/:code', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM PROMOTION
       WHERE PromotionCode = $1`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion not found' 
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        code: row.promotioncode,
        name: row.promotionname,
        discountType: row.discounttype,
        discountValue: parseFloat(row.discountvalue),
        minimumOrderValue: row.minimumordervalue ? parseFloat(row.minimumordervalue) : null,
        startDate: row.startdate,
        endDate: row.enddate,
        usageLimit: row.usagelimit,
        status: row.status,
        isActive: new Date(row.enddate) >= new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching promotion', 
      error: error.message 
    });
  }
});

// VALIDATE PROMOTION CODE
router.post('/validate/:code', async (req, res) => {
  try {
    const { orderValue } = req.body;

    const result = await pool.query(
      `SELECT * FROM PROMOTION
       WHERE PromotionCode = $1
       AND Status = 'ACTIVE'
       AND StartDate <= CURRENT_DATE
       AND EndDate >= CURRENT_DATE`,
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion code is invalid or expired' 
      });
    }

    const promotion = result.rows[0];

    if (promotion.minimumordervalue && orderValue < promotion.minimumordervalue) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum order value required: ${promotion.minimumordervalue}` 
      });
    }

    let discount = 0;
    if (promotion.discounttype === 'PERCENTAGE') {
      discount = (orderValue * promotion.discountvalue) / 100;
    } else if (promotion.discounttype === 'FIXED_AMOUNT') {
      discount = promotion.discountvalue;
    }

    res.json({
      success: true,
      data: {
        code: promotion.promotioncode,
        name: promotion.promotionname,
        discountType: promotion.discounttype,
        discountValue: parseFloat(promotion.discountvalue),
        discountAmount: parseFloat(discount.toFixed(2)),
        finalPrice: parseFloat((orderValue - discount).toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error validating promotion', 
      error: error.message 
    });
  }
});

// CREATE PROMOTION (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { code, name, discountType, discountValue, minimumOrderValue, startDate, endDate, usageLimit, status } = req.body;

    if (!code || !name || !discountType || !discountValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code, Name, Discount Type, and Discount Value are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO PROMOTION (PromotionCode, PromotionName, DiscountType, DiscountValue, MinimumOrderValue, StartDate, EndDate, UsageLimit, Status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [code, name, discountType, discountValue, minimumOrderValue || null, startDate || null, endDate || null, usageLimit || null, status || 'ACTIVE']
    );

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      data: {
        code: row.promotioncode,
        name: row.promotionname,
        discountType: row.discounttype,
        discountValue: parseFloat(row.discountvalue),
        minimumOrderValue: row.minimumordervalue ? parseFloat(row.minimumordervalue) : null,
        startDate: row.startdate,
        endDate: row.enddate,
        usageLimit: row.usagelimit,
        status: row.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating promotion', 
      error: error.message 
    });
  }
});

// UPDATE PROMOTION (ADMIN)
router.put('/:code', async (req, res) => {
  try {
    const { name, discountType, discountValue, minimumOrderValue, startDate, endDate, usageLimit, status } = req.body;

    const result = await pool.query(
      `UPDATE PROMOTION
       SET PromotionName = COALESCE($1, PromotionName),
           DiscountType = COALESCE($2, DiscountType),
           DiscountValue = COALESCE($3, DiscountValue),
           MinimumOrderValue = COALESCE($4, MinimumOrderValue),
           StartDate = COALESCE($5, StartDate),
           EndDate = COALESCE($6, EndDate),
           UsageLimit = COALESCE($7, UsageLimit),
           Status = COALESCE($8, Status)
       WHERE PromotionCode = $9
       RETURNING *`,
      [name || null, discountType || null, discountValue || null, minimumOrderValue || null, startDate || null, endDate || null, usageLimit || null, status || null, req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion not found' 
      });
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        code: row.promotioncode,
        name: row.promotionname,
        discountType: row.discounttype,
        discountValue: parseFloat(row.discountvalue),
        minimumOrderValue: row.minimumordervalue ? parseFloat(row.minimumordervalue) : null,
        startDate: row.startdate,
        endDate: row.enddate,
        usageLimit: row.usagelimit,
        status: row.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating promotion', 
      error: error.message 
    });
  }
});

// DELETE PROMOTION (ADMIN)
router.delete('/:code', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM PROMOTION WHERE PromotionCode = $1 RETURNING PromotionCode',
      [req.params.code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Promotion not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Promotion deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting promotion', 
      error: error.message 
    });
  }
});

module.exports = router;
