const admin = require("../config/firebaseAdmin");
const { db } = require("../models/index");
const auth = require("../middleware/authJwt");
const authTokenService = require("./authToken.services");
const bcrypt = require("bcryptjs");
const otpService = require("./otp.services");
const {
  sendOtpResetPW,
  sendOtpVerifyAccount,
} = require("../services/email.services");

const createAndSendOTP = async (userId, email) => {
  try {
    const otpInfo = await otpService.createOtp(userId, "verify_email", 30);
    await sendOtpVerifyAccount(email, otpInfo);
    return otpInfo;
  } catch (err) {
    console.error("[OTP Error]", err);
    throw err;
  }
};

const verifyGoogleToken = async (idToken, callback) => {
  try {
    if (!idToken) {
      return callback(null, {
        success: false,
        message: "Token không được cung cấp",
        data: null,
      });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("Firebase decoded token:", decoded);

    if (!decoded.email) {
      return callback(null, {
        success: false,
        message: "Tài khoản Google không có email.",
        data: null,
      });
    }

    const existingUser = await db.user.findOne({
      where: { email: decoded.email },
    });

    // Trường hợp: Tài khoản mới
    if (!existingUser) {


      // Phát một password ngẫu nhiên
      const pwRandom = generateRandomPassword(12); // Tạo mật khẩu ngẫu nhiên
      console.log(pwRandom); 
      //userData.pwRandom = 
  

      console.log("Hashing password...");
          // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(pwRandom, salt);
      
      console.log("Creating new user...");
      const createdUser = await db.user.create({
        name: decoded.name,
        password: hashedPassword, 
        email: decoded.email,
        avatar: decoded.picture || null,
        active: false,
        point: 50,
        role_id: 1,
      });

      const userCart = await db.cart.create({ user_id: createdUser.id });

      const userData = createdUser.toJSON();
      userData.requireVerification = true;
      userData.cart_id = userCart.id;
      userData.pwRandom = pwRandom; 

      try {
        await createAndSendOTP(createdUser.id, createdUser.email);
         // Đợi 1 phút (60,000 ms)
        setTimeout(async () => {
          try {
            // Gọi API kiểm tra user đã xác thực OTP thành công chưa
            const userStatus = await checkUserOTPVerificationStatus(
              existingUser.id
            );

            if (userStatus.isVerified) {
              notificationService.createNotification(
                {
                  user_id: existingUser.id,
                  title: "Welcome to OMGNice!",
                  message: "Thanks for signing up. Happy to have you! ❤️",
                  type: "system",
                },
                () => {}
              );
          } else {
            console.log("User chưa xác thực OTP trong 1 phút");
          }
        } catch (err) {
          console.warn("Không thể gửi OTP cho user mới nhưng vẫn tiếp tục");
        }
      }, 60000); // 60000 ms = 1 phút

      return callback(null, {
        success: true,
        message: "Đây là tài khoản mới nên cần xác thực token mới được vào.",
        data: userData,
      });
    } catch (err) {
      console.warn("Không thể gửi OTP cho user mới nhưng vẫn tiếp tục");
      return callback(null, {
        success: true,
        message: "Đây là tài khoản mới nên cần xác thực token mới được vào.",
        data: userData,
      });
    }
  }

    // Trường hợp: Tài khoản đã tồn tại nhưng chưa active
    if (!existingUser.active) {
      const userData = existingUser.toJSON?.() || existingUser;

      try {
        await createAndSendOTP(existingUser.id, existingUser.email);

        // Đợi 1 phút (60,000 ms)
        setTimeout(async () => {
          try {
            // Gọi API kiểm tra user đã xác thực OTP thành công chưa
            const userStatus = await checkUserOTPVerificationStatus(
              existingUser.id
            );

            if (userStatus.isVerified) {
              notificationService.createNotification(
                {
                  user_id: existingUser.id,
                  title: "Welcome to OMGNice!",
                  message: "Thanks for signing up. Happy to have you! ❤️",
                  type: "system",
                },
                () => {}
              );
            } else {
              console.log("User chưa xác thực OTP trong 1 phút");
            }
          } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái OTP:", error);
          }
        }, 60000); // 60000 ms = 1 phút
      } catch (err) {
        console.warn("Không thể gửi OTP xác thực lại nhưng vẫn tiếp tục");
      }

      return callback(null, {
        success: false,
        message:
          "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và nhập mã xác thực.",
        requireVerification: true,
        data: userData,
      });
    }

    // Trường hợp: Tài khoản đã xác thực -> tạo token
    const accessToken = auth.generateAccessToken({
      id: existingUser.id,
      email: existingUser.email,
      role_id: existingUser.role_id,
    });

    const refreshToken = await authTokenService.generateRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
      role_id: existingUser.role_id,
    });

    const userData = existingUser.toJSON?.() || existingUser;
    delete userData.password;
    userData.accessToken = accessToken;
    userData.refreshToken = refreshToken;

    console.log(userData);

    return callback(null, {
      success: true,
      message: "Đăng nhập thành công",
      data: userData,
    });
  } catch (error) {
    console.error("Firebase Token verification failed:", error);
    return callback(error, {
      success: false,
      message: "Xác thực token thất bại: " + (error.message || error),
      data: null,
    });
  }
}

function generateRandomPassword(length = 8) {
  if (length < 8) length = 8; // Đảm bảo ít nhất 8 ký tự
  
  const charsetLower = "abcdefghijklmnopqrstuvwxyz"; // Chữ cái thường
  const charsetUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Chữ cái hoa
  const charsetNumbers = "0123456789"; // Số
  const charsetSpecial = "!@#$%^&*()_+"; // Ký tự đặc biệt
  
  let password = "";
  
  // Đảm bảo có ít nhất một ký tự của mỗi loại
  password += charsetLower[Math.floor(Math.random() * charsetLower.length)];
  password += charsetUpper[Math.floor(Math.random() * charsetUpper.length)];
  password += charsetNumbers[Math.floor(Math.random() * charsetNumbers.length)];
  password += charsetSpecial[Math.floor(Math.random() * charsetSpecial.length)];
  
  // Điền phần còn lại của mật khẩu với các ký tự ngẫu nhiên từ tất cả các loại
  const allCharset = charsetLower + charsetUpper + charsetNumbers + charsetSpecial;
  for (let i = password.length; i < length; i++) {
    password += allCharset[Math.floor(Math.random() * allCharset.length)];
  }
  
  // Xáo trộn mật khẩu để đảm bảo tính ngẫu nhiên
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  return password;
}


module.exports = {
  verifyGoogleToken,
};
