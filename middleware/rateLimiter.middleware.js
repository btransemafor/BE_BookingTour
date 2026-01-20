const rateLimit = require('express-rate-limit'); 
const loginLimiter = rateLimit({
    windowMs: 5*60*1000, // 5 phut - Nếu đăng nhập quá 5 lần trong 5 phút thì chặn 429 Too Many Requests 
    max: 5, 
    message: "Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút."

}); 

module.exports = {loginLimiter}