const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../config/database");
// const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

// ==================== TOUR ENDPOINTS ====================

// GET: Danh sách tours (format frontend)
// Type Tour: id, title, description, image, location, duration, price, originalPrice?, rating, reviews, maxGuests, category, featured?, availableSpots?, badges?
router.get('/list', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const offset = (page - 1) * limit;
    
    const { categoryId, locationId, isFeatured, isHotDeal, minPrice, maxPrice, sortBy, search, difficulty } = req.query;

    let query = `SELECT 
      t.id,
      t.name as title,
      t.short_description as description,
      t.description as fullDescription,
      (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image,
      l.name as location,
      CONCAT(t.duration_days, ' ngày ', t.duration_nights, ' đêm') as duration,
      t.base_price as price,
      t.child_price as childPrice,
      t.rating,
      COALESCE(t.review_count, 0) as reviews,
      COALESCE(t.max_participants, 0) as maxGuests,
      c.name as category,
      t.is_featured as featured,
      t.is_hot_deal as isHotDeal,
      t.difficulty as difficulty,
      COALESCE((
        SELECT SUM(GREATEST(ts.available_slots - COALESCE(ts.booked_slots, 0), 0))
        FROM tour_schedules ts
        WHERE ts.tour_id = t.id AND ts.status = 'OPEN'
      ), 0) as availableSpots,
      t.booking_count,
      t.view_count,
      t.slug
     FROM tours t
     LEFT JOIN locations l ON t.location_id = l.id
     LEFT JOIN tour_categories c ON t.category_id = c.id
     WHERE t.status = 'ACTIVE'`;

    const params = [];

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (locationId) {
      query += ` AND t.location_id = $${params.length + 1}`;
      params.push(locationId);
    }
    if (isFeatured === 'true') {
      query += ` AND t.is_featured = TRUE`;
    }
    if (isHotDeal === 'true') {
      query += ` AND t.is_hot_deal = TRUE`;
    }
    if (difficulty) {
      query += ` AND t.difficulty = $${params.length + 1}`;
      params.push(difficulty);
    }
    if (minPrice) {
      query += ` AND t.base_price >= $${params.length + 1}`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND t.base_price <= $${params.length + 1}`;
      params.push(parseFloat(maxPrice));
    }
    if (search) {
      query += ` AND (t.name ILIKE $${params.length + 1} OR t.short_description ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort
    let orderBy = ' ORDER BY t.created_at DESC';
    if (sortBy === 'price_asc') {
      orderBy = ' ORDER BY t.base_price ASC';
    } else if (sortBy === 'price_desc') {
      orderBy = ' ORDER BY t.base_price DESC';
    } else if (sortBy === 'rating') {
      orderBy = ' ORDER BY t.rating DESC, t.review_count DESC';
    } else if (sortBy === 'booking') {
      orderBy = ' ORDER BY t.booking_count DESC';
    } else if (sortBy === 'view') {
      orderBy = ' ORDER BY t.view_count DESC';
    }

    query += orderBy;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM tours t WHERE t.status = 'ACTIVE'`;
    const countParams = [];

    if (categoryId) {
      countQuery += ` AND t.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }
    if (locationId) {
      countQuery += ` AND t.location_id = $${countParams.length + 1}`;
      countParams.push(locationId);
    }
    if (isFeatured === 'true') countQuery += ` AND t.is_featured = TRUE`;
    if (isHotDeal === 'true') countQuery += ` AND t.is_hot_deal = TRUE`;
    if (difficulty) {
      countQuery += ` AND t.difficulty = $${countParams.length + 1}`;
      countParams.push(difficulty);
    }
    if (minPrice) {
      countQuery += ` AND t.base_price >= $${countParams.length + 1}`;
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      countQuery += ` AND t.base_price <= $${countParams.length + 1}`;
      countParams.push(parseFloat(maxPrice));
    }
    if (search) {
      countQuery += ` AND (t.name ILIKE $${countParams.length + 1} OR t.short_description ILIKE $${countParams.length + 2})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    // Map to Tour Type
    const data = result.rows.map(row => {
      // Giá gốc luôn là basePrice
      const originalPrice = parseFloat(row.price);
      // Giá áp dụng: nếu có childPrice thì dùng nó (giá giảm), không thì dùng basePrice
      const discountedPrice = row.childPrice ? parseFloat(row.childPrice) : originalPrice;
      
      const tour = {
        id: String(row.id),
        title: row.title,
        description: row.description,
        image: row.image,
        location: row.location,
        duration: row.duration,
        originalPrice: originalPrice,
        price: discountedPrice,
        rating: parseFloat(row.rating) || 0,
        reviews: row.reviews,
        maxGuests: parseInt(row.maxGuests),
        availableSpots: parseInt(row.availableSpots) || 0,
        category: row.category,
      };

      // Optional fields
      tour.featured = !!row.featured;
      
      // Generate badges based on conditions
      const badges = [];
      if (row.isHotDeal) badges.push('HOT_DEAL');
      if (row.featured) badges.push('FEATURED');
      if (row.difficulty === 'EASY') badges.push('BEGINNER');
      if (row.difficulty === 'DIFFICULT') badges.push('ADVENTURE');
      if (row.reviews > 50) badges.push('POPULAR');
      if (badges.length > 0) tour.badges = badges;

      return tour;
    });

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data
    });
  } catch (error) {
    console.error('Error fetching tour list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour list',
      error: error.message
    });
  }
});

// GET: Lấy tất cả tours với filter, sort, pagination (API format)
router.get('/', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const offset = (page - 1) * limit;
    
    const categoryId = req.query.categoryId;
    const locationId = req.query.locationId;
    const status = req.query.status || 'ACTIVE';
    const isFeatured = req.query.isFeatured === 'true';
    const isHotDeal = req.query.isHotDeal === 'true';
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const sortBy = req.query.sortBy || 'created';
    const search = req.query.search;

    let query = `SELECT 
      t.id,
      t.name,
      t.slug,
      t.short_description,
      t.description,
      t.duration_days,
      t.duration_nights,
      t.base_price,
      t.child_price,
      t.infant_price,
      t.max_participants,
      t.min_participants,
      t.difficulty,
      t.transportation_type,
      t.status,
      t.is_featured,
      t.is_hot_deal,
      t.view_count,
      t.booking_count,
      t.rating,
      t.review_count,
      t.created_at,
      l.name as location_name,
      c.name as category_name,
      (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as cover_image
     FROM tours t
     LEFT JOIN locations l ON t.location_id = l.id
     LEFT JOIN tour_categories c ON t.category_id = c.id
     WHERE t.status = $1`;

    let params = [status];

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }
    if (locationId) {
      query += ` AND t.location_id = $${params.length + 1}`;
      params.push(locationId);
    }
    if (isFeatured) {
      query += ` AND t.is_featured = TRUE`;
    }
    if (isHotDeal) {
      query += ` AND t.is_hot_deal = TRUE`;
    }
    if (minPrice !== null) {
      query += ` AND t.base_price >= $${params.length + 1}`;
      params.push(minPrice);
    }
    if (maxPrice !== null) {
      query += ` AND t.base_price <= $${params.length + 1}`;
      params.push(maxPrice);
    }
    if (search) {
      query += ` AND (t.name ILIKE $${params.length + 1} OR t.description ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        query += ` ORDER BY t.base_price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY t.base_price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY t.rating DESC, t.review_count DESC`;
        break;
      case 'booking_count':
        query += ` ORDER BY t.booking_count DESC`;
        break;
      case 'view_count':
        query += ` ORDER BY t.view_count DESC`;
        break;
      default:
        query += ` ORDER BY t.created_at DESC`;
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM tours t WHERE t.status = $1`;
    let countParams = [status];

    if (categoryId) {
      countQuery += ` AND t.category_id = $${countParams.length + 1}`;
      countParams.push(categoryId);
    }
    if (locationId) {
      countQuery += ` AND t.location_id = $${countParams.length + 1}`;
      countParams.push(locationId);
    }
    if (isFeatured) countQuery += ` AND t.is_featured = TRUE`;
    if (isHotDeal) countQuery += ` AND t.is_hot_deal = TRUE`;
    if (minPrice !== null) {
      countQuery += ` AND t.base_price >= $${countParams.length + 1}`;
      countParams.push(minPrice);
    }
    if (maxPrice !== null) {
      countQuery += ` AND t.base_price <= $${countParams.length + 1}`;
      countParams.push(maxPrice);
    }
    if (search) {
      countQuery += ` AND (t.name ILIKE $${countParams.length + 1} OR t.description ILIKE $${countParams.length + 2})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = countResult.rows[0].total;

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.short_description,
        durationDays: row.duration_days,
        durationNights: row.duration_nights,
        basePrice: parseFloat(row.base_price),
        childPrice: row.child_price ? parseFloat(row.child_price) : null,
        infantPrice: row.infant_price ? parseFloat(row.infant_price) : null,
        maxParticipants: row.max_participants,
        minParticipants: row.min_participants,
        difficultyLevel: row.difficulty,
        transportationType: row.transportation_type,
        status: row.status,
        isFeatured: !!row.is_featured,
        isHotDeal: !!row.is_hot_deal,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count || 0,
        viewCount: row.view_count,
        bookingCount: row.booking_count,
        locationName: row.location_name,
        categoryName: row.category_name,
        coverImage: row.cover_image,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tours', 
      error: error.message 
    });
  }
});

// POST: Tạo tour mới
router.post('/', async (req, res) => {
  try {
    const {
      name,
      slug,
      locationId,
      categoryId,
      shortDescription,
      description,
      highlights,
      includedServices,
      excludedServices,
      termsConditions,
      cancellationPolicy,
      durationDays,
      durationNights,
      basePrice,
      childPrice,
      infantPrice,
      maxParticipants,
      minParticipants,
      difficultyLevel,
      transportationType,
      departureLocation,
      returnLocation,
      status
    } = req.body;

    if (!name || !locationId || !durationDays || !durationNights || !basePrice || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, locationId, durationDays, durationNights, basePrice, maxParticipants'
      });
    }

    const result = await pool.query(
      `INSERT INTO tours (
        name, slug, location_id, category_id, short_description, description,
        highlights, included_services, excluded_services, terms_conditions,
        cancellation_policy, duration_days, duration_nights, base_price,
        child_price, infant_price, max_participants, min_participants,
        difficulty, transportation_type, departure_location, return_location, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        name, slug || name.toLowerCase().replace(/\s+/g, '-'),
        locationId, categoryId || null, shortDescription, description,
        highlights, includedServices, excludedServices, termsConditions,
        cancellationPolicy, durationDays, durationNights, basePrice,
        childPrice || null, infantPrice || null, maxParticipants, minParticipants || 1,
        difficultyLevel || 'EASY', transportationType, departureLocation, returnLocation,
        status || 'DRAFT'
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        locationId,
        categoryId,
        basePrice: parseFloat(basePrice),
        durationDays,
        durationNights,
        maxParticipants,
        status: status || 'DRAFT',
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tour',
      error: error.message
    });
  }
});

// GET: Lấy chi tiết tour đầy đủ
router.get('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;

    // Get tour details with location and category
    const tourResult = await pool.query(
      `SELECT 
        t.*,
        l.id as location_id,
        l.name as location_name,
        l.slug as location_slug,
        l.latitude as location_latitude,
        l.longitude as location_longitude,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon
       FROM tours t
       LEFT JOIN locations l ON t.location_id = l.id
       LEFT JOIN tour_categories c ON t.category_id = c.id
       WHERE t.id = $1`,
      [tourId]
    );

    if (tourResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const tour = tourResult.rows[0];

    // Update view count
    await pool.query(
      'UPDATE tours SET view_count = view_count + 1 WHERE id = $1',
      [tourId]
    );

    // Get all images
    const imagesResult = await pool.query(
      `SELECT 
        id,
        image_url,
        alt_text,
        is_cover,
        display_order
       FROM tour_images
       WHERE tour_id = $1
       ORDER BY is_cover DESC, display_order ASC`,
      [tourId]
    );

    // Get cover image
    const coverImage = imagesResult.rows.find(img => img.is_cover)?.image_url || null;

    // Get tour days with places
    const daysResult = await pool.query(
      `SELECT 
        td.id,
        td.day_number,
        td.title,
        td.description,
        td.accommodation,
        td.meals
       FROM tour_days td
       WHERE td.tour_id = $1
       ORDER BY td.day_number ASC`,
      [tourId]
    );

    // Get places for each day
    const itinerary = await Promise.all(
      daysResult.rows.map(async (day) => {
        const placesResult = await pool.query(
          `SELECT 
            dp.id,
            dp.visit_order,
            dp.duration_minutes,
            dp.notes,
            p.id as place_id,
            p.name as place_name,
            p.slug as place_slug,
            p.address as place_address,
            p.latitude as place_latitude,
            p.longitude as place_longitude,
            p.image_url as place_image_url,
            p.type as place_type,
            p.rating as place_rating
           FROM day_places dp
           JOIN places p ON dp.place_id = p.id
           WHERE dp.tour_day_id = $1
           ORDER BY dp.visit_order ASC`,
          [day.id]
        );

        return {
          day_number: day.day_number,
          title: day.title,
          description: day.description,
          accommodation: day.accommodation,
          meals: day.meals,
          places: placesResult.rows.map(p => ({
            place: {
              id: p.place_id,
              name: p.place_name,
              slug: p.place_slug,
              address: p.place_address,
              latitude: p.place_latitude ? parseFloat(p.place_latitude) : null,
              longitude: p.place_longitude ? parseFloat(p.place_longitude) : null,
              image_url: p.place_image_url,
              type: p.place_type,
              rating: p.place_rating ? parseFloat(p.place_rating) : null
            },
            visit_order: p.visit_order,
            duration_minutes: p.duration_minutes,
            notes: p.notes
          }))
        };
      })
    );

    // Get amenities
    const amenitiesResult = await pool.query(
      `SELECT 
        ta.amenity_id,
        a.name,
        a.slug,
        a.icon,
        a.category,
        ta.price,
        ta.is_included,
        ta.is_optional
       FROM tour_amenities ta
       JOIN amenities a ON ta.amenity_id = a.id
       WHERE ta.tour_id = $1
       ORDER BY a.category, a.name`,
      [tourId]
    );

    // Get upcoming schedules (status OPEN, start_date >= today)
    const schedulesResult = await pool.query(
      `SELECT 
        ts.id as schedule_id,
        ts.start_date,
        ts.end_date,
        ts.price_override,
        ts.available_slots,
        COALESCE(ts.booked_slots, 0) as booked_slots,
        ts.status
       FROM tour_schedules ts
       WHERE ts.tour_id = $1 AND ts.status = 'OPEN' AND ts.start_date >= CURRENT_DATE
       ORDER BY ts.start_date ASC
       LIMIT 10`,
      [tourId]
    );

    // Build response
    res.json({
      success: true,
      data: {
        tour: {
          id: tour.id,
          name: tour.name,
          slug: tour.slug,
          short_description: tour.short_description,
          description: tour.description,
          highlights: tour.highlights,
          included_services: tour.included_services,
          excluded_services: tour.excluded_services,
          cancellation_policy: tour.cancellation_policy,
          terms_conditions: tour.terms_conditions,
          duration_days: tour.duration_days,
          duration_nights: tour.duration_nights,
          base_price: parseFloat(tour.base_price),
          child_price: tour.child_price ? parseFloat(tour.child_price) : null,
          infant_price: tour.infant_price ? parseFloat(tour.infant_price) : null,
          difficulty: tour.difficulty,
          transportation_type: tour.transportation_type,
          departure_location: tour.departure_location,
          return_location: tour.return_location,
          is_featured: !!tour.is_featured,
          is_hot_deal: !!tour.is_hot_deal,
          rating: parseFloat(tour.rating) || 0,
          review_count: tour.review_count || 0,
          view_count: tour.view_count || 0,
          booking_count: tour.booking_count || 0
        },
        location: tour.location_id ? {
          id: tour.location_id,
          name: tour.location_name,
          slug: tour.location_slug,
          latitude: tour.location_latitude ? parseFloat(tour.location_latitude) : null,
          longitude: tour.location_longitude ? parseFloat(tour.location_longitude) : null
        } : null,
        category: tour.category_id ? {
          id: tour.category_id,
          name: tour.category_name,
          slug: tour.category_slug,
          icon: tour.category_icon
        } : null,
        cover_image: coverImage,
        images: imagesResult.rows.map(img => ({
          url: img.image_url,
          alt: img.alt_text,
          is_cover: !!img.is_cover,
          order: img.display_order
        })),
        itinerary: itinerary,
        amenities: amenitiesResult.rows.map(am => ({
          amenity_id: am.amenity_id,
          name: am.name,
          slug: am.slug,
          icon: am.icon,
          category: am.category,
          price: parseFloat(am.price) || 0,
          is_included: !!am.is_included,
          is_optional: !!am.is_optional
        })),
        upcoming_schedules: schedulesResult.rows.map(sch => ({
          schedule_id: sch.schedule_id,
          start_date: sch.start_date,
          end_date: sch.end_date,
          price_override: sch.price_override ? parseFloat(sch.price_override) : null,
          available_slots: sch.available_slots,
          booked_slots: sch.booked_slots,
          status: sch.status
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching tour details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tour details',
      error: error.message
    });
  }
});

// PUT: Cập nhật tour
router.put('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldsMap = {
      name: 'name',
      slug: 'slug',
      locationId: 'location_id',
      categoryId: 'category_id',
      shortDescription: 'short_description',
      description: 'description',
      highlights: 'highlights',
      includedServices: 'included_services',
      excludedServices: 'excluded_services',
      termsConditions: 'terms_conditions',
      cancellationPolicy: 'cancellation_policy',
      durationDays: 'duration_days',
      durationNights: 'duration_nights',
      basePrice: 'base_price',
      childPrice: 'child_price',
      infantPrice: 'infant_price',
      maxParticipants: 'max_participants',
      minParticipants: 'min_participants',
      difficultyLevel: 'difficulty',
      transportationType: 'transportation_type',
      departureLocation: 'departure_location',
      returnLocation: 'return_location',
      status: 'status',
      isFeatured: 'is_featured',
      isHotDeal: 'is_hot_deal'
    };

    Object.entries(fieldsMap).forEach(([key, dbField]) => {
      if (req.body[key] !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(req.body[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tourId);
    const updateQuery = `UPDATE tours SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const tour = result.rows[0];
    res.json({
      success: true,
      data: {
        id: tour.id,
        name: tour.name,
        basePrice: parseFloat(tour.base_price),
        status: tour.status,
        updatedAt: tour.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tour',
      error: error.message
    });
  }
});

// DELETE: Xóa tour
router.delete('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    const result = await pool.query(
      'DELETE FROM tours WHERE id = $1 RETURNING id',
      [tourId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tour',
      error: error.message
    });
  }
});

// ==================== FEATURED & HOT DEALS ====================

// GET: Tours nổi bật
router.get('/featured/tours', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 8;
    const result = await pool.query(
      `SELECT t.id, t.name, t.base_price, t.duration_days, t.rating, t.review_count, t.slug,
              (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image
       FROM tours t
       WHERE t.is_featured = TRUE AND t.status = 'ACTIVE'
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        basePrice: parseFloat(row.base_price),
        durationDays: row.duration_days,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count,
        image: row.image
      }))
    });
  } catch (error) {
    console.error('Error fetching featured tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured tours',
      error: error.message
    });
  }
});

// GET: Hot deal tours
router.get('/hot-deals/tours', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 8;
    const result = await pool.query(
      `SELECT t.id, t.name, t.base_price, t.booking_count, t.slug,
              (SELECT image_url FROM tour_images WHERE tour_id = t.id AND is_cover = TRUE LIMIT 1) as image
       FROM tours t
       WHERE t.is_hot_deal = TRUE AND t.status = 'ACTIVE'
       ORDER BY t.booking_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        basePrice: parseFloat(row.base_price),
        bookingCount: row.booking_count,
        image: row.image
      }))
    });
  } catch (error) {
    console.error('Error fetching hot deal tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hot deal tours',
      error: error.message
    });
  }
});

module.exports = router;
