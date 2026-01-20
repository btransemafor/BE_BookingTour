const validator = require('validator');

module.exports = (req, res, next) => {
    const { email } = req.body;

    // Kiểm tra xem email có tồn tại trong request không
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    // Kiểm tra email có đúng định dạng không
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Nếu hợp lệ, tiếp tục vào Controller
    next();
};
