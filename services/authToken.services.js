const { db } = require("../models/index");
const authJwt = require("../middleware/authJwt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
// Generate Refresh Token
function generateRefreshToken(dataUser) {
  const refresh_token = jwt.sign(
    {
      id: dataUser.id,
      email: dataUser.email,
      role_id: dataUser.role_id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
  db.authToken.create({
    user_id: dataUser.id,
    token: refresh_token,
    expires_at: expiresAt,
    is_active: true,
  });
  return refresh_token;
}

// Refresh Token để xin cấp lại access Token
const refreshToken = async (refreshToken, callback) => {
  try {
    // 1. Tìm refresh token trong DB
    const refresh_token = await db.authToken.findOne({
      where: {
        token: refreshToken,
        is_active: true,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!refresh_token) {
      return callback(new Error("Refresh token not found or inactive"), null);
    }

    // 2. Giải mã token
    const userData_decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!userData_decoded) {
      return callback(new Error("Invalid refresh token"), null);
    }

    // 3. Kiểm tra user tồn tại
    const user = await db.user.findOne({
      where: {
        id: userData_decoded.id,
        email: userData_decoded.email,
        role_id: userData_decoded.role_id,
      },
    });

    if (!user) {
      return callback(new Error("User not found"), null);
    }

    // 4. Tạo access token mới
    const newAccessToken = authJwt.generateAccessToken(userData_decoded);
    return callback(null, {
      access_token: newAccessToken,
    });
  } catch (error) {
    return callback(error, null);
  }
};


module.exports = {
  generateRefreshToken,
  refreshToken,
};
