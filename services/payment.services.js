/* const Stripe = require('stripe');
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async createPaymentIntent({
    amount,
    currency,
    userId,
    addressId,
    shippingMethodId,
    paymentMethod,
    shippingFee,
    promotionId,
    discountAmount,
    deliveryTimeSlot,
    notes,
  }) {
    try {
      // Tạo Order
      const order = await Order.create({
        user_id: userId,
        address_id: addressId,
        shipping_method_id: shippingMethodId,
        payment_method: paymentMethod || 'card',
        orderTotal: amount,
        shipping_fee: shippingFee || 0,
        promotion_id: promotionId || null,
        discount_amount: discountAmount || 0,
        delivery_time_slot: deliveryTimeSlot || null,
        orderStatus: 'processing',
        notes: notes || null,
        paymentStatus: false,
      });

      // Tạo Customer và Ephemeral Key
      const customer = await stripe.customers.create({
        metadata: { userId },
      });

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: '2024-12-18.acacia' }
      );

      // Tạo PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: currency || 'usd',
        customer: customer.id,
        payment_method_types: ['card'],
        automatic_payment_methods: { enabled: true },
      });

      // Tạo Payment và liên kết với Order
      const payment = await Payment.create({
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status,
        userId,
        customerId: customer.id,
      });

      // Cập nhật Order với paymentId
      await Order.update(
        { paymentId: payment.id },
        { where: { id: order.id } }
      );

      return {
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId: customer.id,
        orderId: order.id,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async handleWebhook(payload, signature) {
    try {
      const endpointSecret = process.env.WEBHOOK_SECRET;
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await Payment.update(
            { status: 'succeeded' },
            { where: { paymentIntentId: paymentIntent.id } }
          );
          const payment = await Payment.findOne({ where: { paymentIntentId: paymentIntent.id } });
          if (payment) {
            const order = await Order.findOne({ where: { paymentId: payment.id } });
            if (order) {
              await Order.update(
                { paymentStatus: true, orderStatus: 'completed', updatedAt: new Date() },
                { where: { id: order.id } }
              );
            }
          }
          console.log(`Payment succeeded: ${paymentIntent.id}`);
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          await Payment.update(
            { status: 'failed' },
            { where: { paymentIntentId: failedPayment.id } }
          );
          const failedPaymentRecord = await Payment.findOne({ where: { paymentIntentId: failedPayment.id } });
          if (failedPaymentRecord) {
            const failedOrder = await Order.findOne({ where: { paymentId: failedPaymentRecord.id } });
            if (failedOrder) {
              await Order.update(
                { paymentStatus: false, orderStatus: 'cancelled', updatedAt: new Date() },
                { where: { id: failedOrder.id } }
              );
            }
          }
          console.log(`Payment failed: ${failedPayment.id}`);
          break;
        case 'payment_intent.processing':
          const processingPayment = event.data.object;
          await Payment.update(
            { status: 'processing' },
            { where: { paymentIntentId: processingPayment.id } }
          );
          console.log(`Payment processing: ${processingPayment.id}`);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook error: ${error.message}`);
    }
  }
}

module.exports = new PaymentService(); */

const PayOS = require('@payos/node');

class PaymentService {
  payOS = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);

  async createPaymentLink(orderCode, amount, description = 'Processing Payment') {
    const paymentData = {
      orderCode,
      amount,
     // description,
      returnUrl: 'http://192.168.124.242:8081/success',
      cancelUrl: 'https://your-app.com/cancel',
    };

    try {
      const response = await this.payos.createPaymentLink(paymentData);
      return response.checkoutUrl;
    } catch (error) {
      throw new Error(`Không thể tạo liên kết thanh toán: ${error.message}`);
    }
  }

  // Other methods...
}

//  Khởi tạo và export instance
module.exports = new PaymentService(
  
);