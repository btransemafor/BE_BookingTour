module.exports = (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Yêu cầu cập nhật không chứa dữ liệu nào"
      });
    }
    next(); 
  };
  