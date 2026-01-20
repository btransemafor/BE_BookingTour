

const bcrypt = require('bcryptjs');
const {db} = require('../models/index');
const { Op } = require('sequelize');

class OtpService {
  /**
   * Tạo mã OTP ngẫu nhiên
   * @param {Number} length - Độ dài của mã OTP
   * @returns {String} - Mã OTP
   */

  generateOtp(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Tạo và lưu mã OTP mới cho người dùng
   * @param {String} userId - ID của người dùng
   * @param {String} purpose - Mục đích của OTP (login, reset_password, etc.)
   * @param {Number} expiresInMinutes - Thời gian hết hạn (phút)
   * @returns {Object} - Thông tin OTP
   */
  async createOtp(userId, purpose, expiresInMinutes = 1) {
    try {
      if (!userId) throw new Error("userId không được để trống");
  
      const otpCode = this.generateOtp();
      const hashedOtp = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);
  
      console.log('[DEBUG] Bắt đầu tạo OTP:', { userId, purpose });
      console.log('[DEBUG] OTP raw:', otpCode);
      console.log('[DEBUG] OTP hashed:', hashedOtp);
  
      const payload = {
        user_id: userId,
        otp_code: hashedOtp,
        expires_at: expiresAt,
        purpose
      };
      console.log('[DEBUG] Payload lưu DB:', payload);
  
      const otpRecord = await db.otp.create(payload);
      console.log('[DEBUG] OTP đã lưu với ID:', otpRecord?.id);
  
      return {
        otpCode,
        expiresAt,
        otpId: otpRecord.id
      };
    } catch (error) {
      console.error('[ERROR] Không thể tạo OTP:', {
        userId,
        purpose,
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Lỗi khi tạo OTP: ${error.message}`);
    }
  }
  
  
  /**
   * Xác thực mã OTP
   * @param {String} userId - ID của người dùng
   * @param {String} otpCode - Mã OTP cần xác thực
   * @param {String} purpose - Mục đích của OTP
   * @returns {Boolean} - true nếu OTP hợp lệ
   */
  async verifyOtp(userId, otpCode, purpose) {
    try {
      // Tìm OTP gần nhất chưa sử dụng và chưa hết hạn
      const otpRecord = await db.otp.findOne({
        where: {
          user_id: userId,
          used: false,
          purpose: purpose,
          expires_at: {
            [Op.gt]: new Date() // Chưa hết hạn
          }
        },
        order: [['createdAt', 'DESC']]
      });
      
      // Nếu không tìm thấy OTP hợp lệ
      if (!otpRecord) {
        return { valid: false, message: 'OTP không hợp lệ hoặc đã hết hạn' };
      }
      // Note otpCote : mã raw người dùng nhập 
      // So sánh OTP
      const isValid = await  bcrypt.compareSync(otpCode, otpRecord.otp_code);
      
      if (isValid) {
        // Đánh dấu OTP đã sử dụng
        await otpRecord.update({ used: true });
        return { valid: true, message: 'OTP hợp lệ' };
      }
      
      return { valid: false, message: 'OTP không đúng' };
    } catch (error) {
      throw new Error(`Lỗi khi xác thực OTP: ${error.message}`);
    }
  }

  /**
   * Dọn dẹp OTP đã hết hạn hoặc đã sử dụng
   * @returns {Number} - Số lượng bản ghi đã xóa
   */
  async cleanupOtps() {
    try {
      const result = await db.UserOtp.destroy({
        where: {
          [Op.or]: [
            { used: true },
            { expires_at: { [Op.lt]: new Date() } }
          ]
        }
      });
      
      return result;
    } catch (error) {
      throw new Error(`Lỗi khi dọn dẹp OTP: ${error.message}`);
    }
  }
}

module.exports = new OtpService();