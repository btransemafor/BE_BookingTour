const crypto = require('crypto');

require('dotenv').config(); 


/*
module.exports = {
  generateOTP: () => {
    // Tạo OTP ngẫu nhiên có độ dài OTP_LENGTH
    const digits = '0123456789';
    let OTP = '';
    
    for (let i = 0; i < process.env.OTP_LENGTH; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    
    return OTP;
  },
  
  hashOTP: (otp, email) => {
    // Hash OTP với email để lưu vào DB an toàn hơn
    return crypto
      .createHmac('sha256', email)
      .update(otp)
      .digest('hex');
  }
};


*/ 

const crypto = require('crypto'); // Dùng để tạo giá trị ngẫu nhiên, nhưng ở đây không dùng
const bcrypt = require('bcrypt'); // Thư viện mã hóa mật khẩu/OTP
const { Op } = require('sequelize'); // Toán tử Sequelize (ví dụ: >, <, OR,...)

const generateOtp = (length = 6) => {
  // Generate a random numeric OTP
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};


const createOtp = async (userId, purpose, expiresInMinutes = 10) => {
  try {
    // Generate OTP
    const otpCode = generateOtp();
    
    // Hash OTP for storage
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
    
    // Create OTP record
    const otpRecord = await db.UserOtp.create({
      user_id: userId,
      otp_code: hashedOtp,
      expires_at: expiresAt,
      purpose: purpose
    });
    
    // Return the plain OTP (not hashed) to be sent to the user
    return {
      otpCode: otpCode,
      expiresAt: expiresAt,
      otpId: otpRecord.id
    };
  } catch (error) {
    throw new Error(`Failed to create OTP: ${error.message}`);
  }
};

