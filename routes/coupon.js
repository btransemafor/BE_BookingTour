const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Utility to generate random coupon code
function generateRandomCode(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// CREATE Discount Code (manual or random code)
router.post('/', async (req, res) => {
  try {
    let {
      code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
      valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
    } = req.body;
    if (!code || code.trim() === '') {
      code = generateRandomCode(10);
    }
    const result = await pool.query(
      `INSERT INTO discount_codes (
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`,
      [
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ all Discount Codes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM discount_codes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one Discount Code by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM discount_codes WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE Discount Code
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
      valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by
    } = req.body;
    const result = await pool.query(
      `UPDATE discount_codes SET
        code=$1, name=$2, description=$3, discount_type=$4, discount_value=$5, max_discount_amount=$6, min_order_amount=$7, max_uses=$8, max_uses_per_user=$9,
        valid_from=$10, valid_to=$11, is_active=$12, is_public=$13, applicable_tour_ids=$14, applicable_category_ids=$15, created_by=$16, updated_at=NOW()
        WHERE id=$17 RETURNING *`,
      [
        code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user,
        valid_from, valid_to, is_active, is_public, applicable_tour_ids, applicable_category_ids, created_by, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Discount Code
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM discount_codes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Discount code not found' });
    res.json({ message: 'Discount code deleted', discount_code: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHECK Discount Code validity
router.post('/check', async (req, res) => {
  try {
    const { code, user_id, order_amount, tour_id, category_id } = req.body;
    // Find code, check active, date, usage, min order, applicable tour/category
    const result = await pool.query(
      `SELECT * FROM discount_codes WHERE code = $1 AND is_active = TRUE AND valid_from <= CURRENT_TIMESTAMP AND valid_to >= CURRENT_TIMESTAMP`,
      [code]
    );
    if (result.rows.length === 0) return res.status(404).json({ valid: false, error: 'Mã không hợp lệ hoặc đã hết hạn' });
    const discount = result.rows[0];
    // Check min_order_amount
    if (discount.min_order_amount && order_amount && Number(order_amount) < Number(discount.min_order_amount)) {
      return res.status(400).json({ valid: false, error: `Đơn hàng phải từ ${discount.min_order_amount}` });
    }
    // Check max_uses
    if (discount.max_uses && discount.used_count && discount.used_count >= discount.max_uses) {
      return res.status(400).json({ valid: false, error: 'Mã đã hết lượt sử dụng' });
    }
    // Check max_uses_per_user
    if (user_id && discount.max_uses_per_user) {
      const userUsage = await pool.query(
        `SELECT COUNT(*) FROM discount_code_usages WHERE discount_code_id = $1 AND user_id = $2`,
        [discount.id, user_id]
      );
      if (Number(userUsage.rows[0].count) >= discount.max_uses_per_user) {
        return res.status(400).json({ valid: false, error: 'Bạn đã sử dụng mã này tối đa số lần cho phép' });
      }
    }
    // Check applicable_tour_ids
    if (discount.applicable_tour_ids && Array.isArray(discount.applicable_tour_ids) && discount.applicable_tour_ids.length > 0 && tour_id) {
      if (!discount.applicable_tour_ids.includes(Number(tour_id))) {
        return res.status(400).json({ valid: false, error: 'Mã không áp dụng cho tour này' });
      }
    }
    // Check applicable_category_ids
    if (discount.applicable_category_ids && Array.isArray(discount.applicable_category_ids) && discount.applicable_category_ids.length > 0 && category_id) {
      if (!discount.applicable_category_ids.includes(Number(category_id))) {
        return res.status(400).json({ valid: false, error: 'Mã không áp dụng cho loại tour này' });
      }
    }
    res.json({ valid: true, discount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
