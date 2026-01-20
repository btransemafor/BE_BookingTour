const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Storage config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = req.folder || 'uploads';
    const filename = file.originalname.split('.')[0] + '-' + Date.now();
    return {
      folder,
      format: 'png', // auto convert
      public_id: filename,
    };
  },
});

const upload = multer({ storage });

// ✅ Wrapper cho middleware an toàn
const safeSingleUpload = (fieldName) => {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Lỗi upload ảnh', error: err.message });
      } else if (err) {
        return res.status(500).json({ message: 'Lỗi server khi upload ảnh', error: err.message });
      }
      // Không có file cũng next
      return next();
    });
  };
};

module.exports = {
  upload,
  safeSingleUpload,
};
