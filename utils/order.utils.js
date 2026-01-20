// utils/order.utils.js

async function generateOrderId(OrderModel) {
    let id;
    let isUnique = false;
  
    while (!isUnique) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      id = `ORD-${randomNumber}`;
      const exists = await OrderModel.findOne({ where: { id } });
  
      if (!exists) isUnique = true;
    }
  
    return id;
  }
  
  module.exports = {
    generateOrderId,
  };
  