module.exports = function validateRegisterInput(req, res, next) {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: "Tất cả các trường: tên, email, số điện thoại, và mật khẩu đều bắt buộc"
        });
    }

    // Kiểm tra định dạng email đơn giản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Email không hợp lệ"
        });
    }

    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Mật khẩu phải có ít nhất 6 ký tự"
        });
    }

    // (Tuỳ chọn) Kiểm tra định dạng số điện thoại
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Số điện thoại không hợp lệ"
        });
    }

    // Nếu tất cả OK, chuyển tiếp tới controller
    next();
};
