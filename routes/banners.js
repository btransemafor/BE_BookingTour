const express = require("express");
const pool = require("../config/database");

const router = express.Router();

// GET: list banners with filters & pagination
router.get("/", async (req, res) => {
	try {
		const page = req.query.page ? parseInt(req.query.page, 10) : 1;
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
		const offset = (page - 1) * limit;

		const { status, isActive, tag, location, tourId, search, fromDate, toDate } = req.query;

		let query = `SELECT * FROM banner_slides WHERE 1=1`;
		const params = [];

		if (status) {
			params.push(status);
			query += ` AND status = $${params.length}`;
		}
		if (isActive !== undefined) {
			params.push(isActive === "true");
			query += ` AND is_active = $${params.length}`;
		}
		if (tag) {
			params.push(tag);
			query += ` AND tag = $${params.length}`;
		}
		if (location) {
			params.push(`%${location}%`);
			query += ` AND location ILIKE $${params.length}`;
		}
		if (tourId) {
			params.push(tourId);
			query += ` AND tour_id = $${params.length}`;
		}
		if (search) {
			params.push(`%${search}%`, `%${search}%`);
			query += ` AND (title ILIKE $${params.length - 1} OR description ILIKE $${params.length})`;
		}
		if (fromDate) {
			params.push(fromDate);
			query += ` AND (start_date IS NULL OR start_date >= $${params.length})`;
		}
		if (toDate) {
			params.push(toDate);
			query += ` AND (end_date IS NULL OR end_date <= $${params.length})`;
		}

		query += ` ORDER BY display_order ASC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(limit, offset);

		const result = await pool.query(query, params);

		// count
		let countQuery = `SELECT COUNT(*) AS total FROM banner_slides WHERE 1=1`;
		const countParams = [];
		if (status) {
			countParams.push(status);
			countQuery += ` AND status = $${countParams.length}`;
		}
		if (isActive !== undefined) {
			countParams.push(isActive === "true");
			countQuery += ` AND is_active = $${countParams.length}`;
		}
		if (tag) {
			countParams.push(tag);
			countQuery += ` AND tag = $${countParams.length}`;
		}
		if (location) {
			countParams.push(`%${location}%`);
			countQuery += ` AND location ILIKE $${countParams.length}`;
		}
		if (tourId) {
			countParams.push(tourId);
			countQuery += ` AND tour_id = $${countParams.length}`;
		}
		if (search) {
			countParams.push(`%${search}%`, `%${search}%`);
			countQuery += ` AND (title ILIKE $${countParams.length - 1} OR description ILIKE $${countParams.length})`;
		}
		if (fromDate) {
			countParams.push(fromDate);
			countQuery += ` AND (start_date IS NULL OR start_date >= $${countParams.length})`;
		}
		if (toDate) {
			countParams.push(toDate);
			countQuery += ` AND (end_date IS NULL OR end_date <= $${countParams.length})`;
		}

		const countResult = await pool.query(countQuery, countParams);
		const total = parseInt(countResult.rows[0].total, 10);

		res.json({
			success: true,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
			},
			data: result.rows
		});
	} catch (err) {
		console.error("Error fetching banners", err);
		res.status(500).json({ success: false, message: "Error fetching banners", error: err.message });
	}
});

// GET: banner detail
router.get("/:id", async (req, res) => {
	try {
		const result = await pool.query(`SELECT * FROM banner_slides WHERE id = $1`, [req.params.id]);
		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: "Banner not found" });
		}
		res.json({ success: true, data: result.rows[0] });
	} catch (err) {
		console.error("Error fetching banner", err);
		res.status(500).json({ success: false, message: "Error fetching banner", error: err.message });
	}
});

// POST: create banner
router.post("/", async (req, res) => {
	try {
		const {
			title,
			subtitle,
			description,
			image_url,
			mobile_image_url,
			alt_text,
			location,
			tag,
			link_url,
			link_text,
			tour_id,
			display_order,
			status,
			start_date,
			end_date,
			background_color,
			text_color,
			is_active
		} = req.body;

		if (!title || !image_url) {
			return res.status(400).json({ success: false, message: "title and image_url are required" });
		}

		const insertQuery = `
			INSERT INTO banner_slides (
				title, subtitle, description, image_url, mobile_image_url, alt_text,
				location, tag, link_url, link_text, tour_id, display_order, status,
				start_date, end_date, background_color, text_color, is_active
			)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
			RETURNING *`;

		const params = [
			title,
			subtitle || null,
			description || null,
			image_url,
			mobile_image_url || null,
			alt_text || null,
			location || null,
			tag || null,
			link_url || null,
			link_text || null,
			tour_id || null,
			display_order || 0,
			status || "ACTIVE",
			start_date || null,
			end_date || null,
			background_color || null,
			text_color || null,
			is_active !== undefined ? !!is_active : true
		];

		const result = await pool.query(insertQuery, params);
		res.status(201).json({ success: true, data: result.rows[0] });
	} catch (err) {
		console.error("Error creating banner", err);
		res.status(500).json({ success: false, message: "Error creating banner", error: err.message });
	}
});

// PUT: update banner
router.put("/:id", async (req, res) => {
	try {
		const fields = [
			"title",
			"subtitle",
			"description",
			"image_url",
			"mobile_image_url",
			"alt_text",
			"location",
			"tag",
			"link_url",
			"link_text",
			"tour_id",
			"display_order",
			"status",
			"start_date",
			"end_date",
			"background_color",
			"text_color",
			"is_active"
		];

		const updates = [];
		const params = [];

		fields.forEach((f) => {
			if (req.body[f] !== undefined) {
				params.push(req.body[f]);
				updates.push(`${f} = $${params.length}`);
			}
		});

		if (updates.length === 0) {
			return res.status(400).json({ success: false, message: "No fields to update" });
		}

		params.push(req.params.id);
		const query = `UPDATE banner_slides SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`;
		const result = await pool.query(query, params);

		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: "Banner not found" });
		}

		res.json({ success: true, data: result.rows[0] });
	} catch (err) {
		console.error("Error updating banner", err);
		res.status(500).json({ success: false, message: "Error updating banner", error: err.message });
	}
});

// DELETE: remove banner
router.delete("/:id", async (req, res) => {
	try {
		const result = await pool.query(`DELETE FROM banner_slides WHERE id = $1 RETURNING id`, [req.params.id]);
		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: "Banner not found" });
		}
		res.json({ success: true, message: "Banner deleted" });
	} catch (err) {
		console.error("Error deleting banner", err);
		res.status(500).json({ success: false, message: "Error deleting banner", error: err.message });
	}
});

// PATCH: increment view count
router.patch("/:id/view", async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE banner_slides SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING view_count`,
			[req.params.id]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: "Banner not found" });
		}
		res.json({ success: true, data: { view_count: result.rows[0].view_count } });
	} catch (err) {
		console.error("Error incrementing view count", err);
		res.status(500).json({ success: false, message: "Error incrementing view count", error: err.message });
	}
});

// PATCH: increment click count
router.patch("/:id/click", async (req, res) => {
	try {
		const result = await pool.query(
			`UPDATE banner_slides SET click_count = click_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING click_count`,
			[req.params.id]
		);
		if (result.rows.length === 0) {
			return res.status(404).json({ success: false, message: "Banner not found" });
		}
		res.json({ success: true, data: { click_count: result.rows[0].click_count } });
	} catch (err) {
		console.error("Error incrementing click count", err);
		res.status(500).json({ success: false, message: "Error incrementing click count", error: err.message });
	}
});

module.exports = router;
