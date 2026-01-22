

const express = require('express');
const router = express.Router();
const pool = require('../config/database');


// POST: Create a payment for an order
router.post('/', async (req, res) => {
  try {
    const {
      order_code,
      payment_method, // 'MOMO', 'VNPAY', 'ZALOPAY', 'BANK_TRANSFER', 'CASH', 'CARD'
      amount,
      transaction_code,
      gateway_response
    } = req.body;


    // Validate required fields
    if (!order_code || !payment_method || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }


    // Check order exists
    const orderRes = await pool.query('SELECT * FROM orders WHERE order_code = $1', [order_code]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }


    const order_id = orderRes.rows[0].id;


    // Generate payment_code
    const payment_code = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);






    // Insert payment
    const insertSql = `INSERT INTO payments (
      payment_code, order_id, payment_method, amount, payment_status, transaction_code, gateway_response, paid_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    const paymentParams = [
      payment_code,
      order_id,
      payment_method,
      amount,
      'PAID',
      transaction_code || null,
      gateway_response || null,
      new Date()
    ];
    const paymentResult = await pool.query(insertSql, paymentParams);
    const payment = paymentResult.rows[0];


    const info = await pool.query(`
         SELECT o.adult_quantity, o.child_quantity, o.infant_quantity, t.name, o.order_code
        FROM orders o JOIN tours t ON o.tour_id = t.id
        WHERE o.id = $1
        `, [order_id]);
   
   


    // Lấy thêm một số thông tin cần thiết
    // TourName, Số lượng (Trẻ, lớn, em bé ),


    // Update order payment_status
    await pool.query('UPDATE orders SET payment_status = $1 WHERE id = $2', ['PAID', order_id]);


    res.status(201).json({ success: true, data: {
        paymentInfo: payment,
        infoBooking: info.rows[0]
    } });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: 'Error creating payment', error: error.message });
  }
});


// GET: Get payments by order_id
router.get('/order/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;
    const result = await pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY id DESC', [order_id]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payments', error: error.message });
  }
});


module.exports = router;




