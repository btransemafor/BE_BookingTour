const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// GET: List all tour categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tour_categories ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
});

// GET: Get a single tour category by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tour_categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching category', error: error.message });
  }
});

// POST: Create a new tour category
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, icon, is_active } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'Name and slug are required' });
    }
    const result = await pool.query(
      'INSERT INTO tour_categories (name, slug, description, icon, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, description || null, icon || null, is_active !== undefined ? is_active : true]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating category', error: error.message });
  }
});

// PUT: Update a tour category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, is_active } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(slug); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE tour_categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
  }
});

// DELETE: Delete a tour category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tour_categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;
