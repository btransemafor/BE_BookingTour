const cron = require('node-cron');
const db = require('../models/index'); // hoặc đường dẫn tới Sequelize

cron.schedule('0 * * * *', async () => {
  try {
    await db.promotion.update(
      { is_active: false },
      { where: { end_date: { [Op.lt]: new Date() }, is_active: true } }
    );
    console.log('Đã cập nhật các promotion hết hạn!');
  } catch (err) {
    console.error('Lỗi cập nhật:', err);
  }
});
