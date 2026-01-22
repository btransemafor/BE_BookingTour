const pool = require('../config/database');

// Lấy tất cả orders
exports.getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Lấy chi tiết order đầy đủ
exports.getOrderById = async (req, res) => {
  const { code } = req.params;
  console.log('Helo', code)
  try {
    // Lấy thông tin order + join các bảng liên quan
    const orderDetailResult = await pool.query(`
      SELECT o.*,
        u.full_name as user_name, u.email as user_email, u.phone as user_phone,
        t.name as tour_name, t.slug as tour_slug, t.description as tour_description,
        ts.start_date, ts.end_date,
        dc.code as discount_code, dc.discount_type, dc.discount_value,
        p.payment_method, p.amount as payment_amount, p.payment_status, p.paid_at,
        tr.image_url
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN tours t ON o.tour_id = t.id
      LEFT JOIN tour_schedules ts ON o.schedule_id = ts.id
      LEFT JOIN discount_codes dc ON o.discount_code_id = dc.id
      LEFT JOIN payments p ON p.order_id = o.id
      LEFT JOIN tour_images tr ON tr.tour_id = t.id
      WHERE o.order_code = $1 AND tr.is_cover = $2
    `, [code, true]);

    if (!orderDetailResult.rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderDetailResult.rows[0];

    // Kiểm tra order có phải của user đang đăng nhập không
    if (!order.id || isNaN(Number(order.id))) {
      return res.status(500).json({ error: 'Order ID is invalid (not bigint)' });
    }
    if (!req.user || !req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (order.user_id !== req.user) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this order' , success: false, message: 'Forbidden: You do not have access to this order'});
    }

    // Lấy participants và amenities theo order.id (kiểu số)
    let participants = [];
    let amenities = [];
    try {
      const participantsRes = await pool.query(
        'SELECT * FROM order_participants WHERE order_id = $1', [order.id]
      );
      participants = participantsRes.rows;
    } catch (e) {
      console.error('Error fetching participants:', e.message);
    }
    try {
      const amenitiesRes = await pool.query(
        'SELECT * FROM order_amenities WHERE order_id = $1', [order.id]
      );
      amenities = amenitiesRes.rows;
    } catch (e) {
      console.error('Error fetching amenities:', e.message);
    }

    res.json({
      ...order,
      participants,
      amenities
    });
  } catch (err) {
    console.error('Order get error:', err.message);
    res.status(500).json({ error: err.message });
  }
};



// Tạo order mới
exports.createOrder = async (req, res) => {
  const data = req.body;
  try {
    // Chỉ insert các trường cơ bản, các bảng liên quan insert sau
    const insertQuery = `
      INSERT INTO orders (order_code, user_id, tour_id, schedule_id, tour_name, start_date, adult_quantity, child_quantity, infant_quantity, total_participants, contact_name, contact_phone, contact_email, special_requests, subtotal, discount_amount, total_price, status, payment_status, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *
    `;
    const values = [
      data.order_code, data.user_id, data.tour_id, data.schedule_id, data.tour_name, data.start_date, data.adult_quantity, data.child_quantity, data.infant_quantity, data.total_participants, data.contact_name, data.contact_phone, data.contact_email, data.special_requests, data.subtotal, data.discount_amount, data.total_price, data.status, data.payment_status, data.note
    ];
    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Cập nhật order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const updateQuery = `
      UPDATE orders SET
        order_code=$1, user_id=$2, tour_id=$3, schedule_id=$4, tour_name=$5, start_date=$6, adult_quantity=$7, child_quantity=$8, infant_quantity=$9, total_participants=$10, contact_name=$11, contact_phone=$12, contact_email=$13, special_requests=$14, subtotal=$15, discount_amount=$16, total_price=$17, status=$18, payment_status=$19, note=$20, updated_at=NOW()
      WHERE id=$21 RETURNING *
    `;
    const values = [
      data.order_code, data.user_id, data.tour_id, data.schedule_id, data.tour_name, data.start_date, data.adult_quantity, data.child_quantity, data.infant_quantity, data.total_participants, data.contact_name, data.contact_phone, data.contact_email, data.special_requests, data.subtotal, data.discount_amount, data.total_price, data.status, data.payment_status, data.note, id
    ];
    const result = await pool.query(updateQuery, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Xóa order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



