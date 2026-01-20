const dotenv = require('dotenv');
const path = require('path');

// Load chính xác .env từ thư mục gốc backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('ENV Username:', process.env.DB_USERNAME); // phải ra omgnice

const { syncProducts } = require('../services/sync.services');

(async () => {
  try {
    await syncProducts();
    console.log('Done syncing products to Pinecone.');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
})();
