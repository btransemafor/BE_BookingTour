const multer = require('multer');
const path = require('path');

// Cấu hình lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // nhớ tạo sẵn folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// === Custom middleware an toàn === //
const safeSingleUpload = (fieldName) => {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Lỗi upload ảnh', error: err.message });
      } else if (err) {
        return res.status(500).json({ message: 'Lỗi server khi upload ảnh', error: err.message });
      }

      // Nếu không có file => vẫn next bình thường
      return next();
    });
  };
};

module.exports = {
  upload,
  safeSingleUpload,
};
