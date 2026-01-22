const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {authenticateJWT} = require('../middleware/authJwt');
// router.get('/:code', authenticateJWT, orderController.getOrderById);


// CRUD endpoints
router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:code', authenticateJWT, orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);


module.exports = router;



