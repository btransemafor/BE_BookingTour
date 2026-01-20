/*
const sendVerificationEmail = async (userEmail, token) => {
    const verifyUrl = //http://yourdomain.com/api/auth/verify-email?token=${token};

    mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "Xác thực tài khoản",
        html: `<p>Nhấn vào liên kết sau để xác thực tài khoản:</p>
               <a href="${verifyUrl}">${verifyUrl}</a>`,
    };

    await transporter.sendMail(mailOptions);
};
*/

/*
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        host: "smtp-relay.brevo.com",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        text: `Click this link to verify your email: ${process.env.BASE_URL}/api/auth/verify/${token}`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
*/

// services/email.service.js
// const nodemailer = require('nodemailer');

/*
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        host: "smtp-relay.brevo.com",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
    });
  }
  
  async sendEmail(to, subject, text, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async sendOTPEmail(email, otp) {
    const subject = 'Mã xác thực OTP của bạn';
    const text = `Mã xác thực của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h2 style="color: #333;">Mã xác thực của bạn</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi đã nhận được yêu cầu xác thực từ bạn. Vui lòng sử dụng mã OTP sau để hoàn tất quá trình:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong 5 phút.</p>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
      </div>
    `;
    
    return await this.sendEmail(email, subject, text, html);
  }
}

module.exports = new EmailService();

*/

require("dotenv").config();

// If using Gmail instead, use this configuration:
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Use an app password if 2FA is enabled
//   },
// });

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "omgniceten@gmail.com",
    pass: "kkptczknvlpyqism", // Ví dụ: abcd efgh ijkl mnop (viết liền không cách)
  },
});

// Send Email for Verify new Account
// Send Email for Verify new Account
async function sendOtpVerifyAccount(to, otpInfo) {
  try {
    const otpCode = otpInfo.otpCode;

    const htmlContent = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #3498db;">Chào mừng bạn đến với <strong>OMGNICE</strong>!</h2>
        <p>Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới để xác minh tài khoản của bạn:</p>
        <h1 style="text-align: center; color: #3498db; letter-spacing: 4px;">${otpCode}</h1>
        <p>Mã OTP này có hiệu lực trong vòng <strong>30 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để được hỗ trợ.</p>
        <hr>
        <p style="font-size: 12px; color: #999;">Cảm ơn bạn đã chọn <strong>OMGNICE</strong>. Chúc bạn một ngày tốt lành!</p>
      </div>
    `;

    const mailOptions = {
      from: "omgniceten@gmail.com",
      to,
      subject: "[OMGNICE] - Mã OTP xác minh tài khoản",
      text: `Mã OTP xác minh tài khoản của bạn là ${otpCode}. Mã có hiệu lực trong 10 phút.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Send email Content for Reset_password
// Send Email for Verify new Account
async function sendOtpResetPW(to, otpInfo) {
  try {
    const otpCode = otpInfo.otpCode;

    const htmlContent = `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #e67e22;">Hello,</h2>
        <p>You or someone else has requested to reset the password for your account at <strong>OMGNICE</strong>.</p>
        <p>Here is the OTP code to verify your request:</p>
        <h1 style="text-align: center; color: #e67e22; letter-spacing: 4px;">${otpCode}</h1>
        <p>The OTP code is valid for <strong>1 minutes</strong>. Please do not share this code with anyone.</p>
        <p>If you did not make this request, please ignore this email or contact our support team.</p>
        <hr>
        <p style="font-size: 12px; color: #999;">Thank you for using <strong>OMGNICE</strong> services.</p>
      </div>
    `;

    const mailOptions = {
      from: "omgniceten@gmail.com",
      to,
      subject: "[OMGNICE] - Password Reset OTP Code",
      text: `Your OTP code is ${otpCode}. It is valid for 1 minutes.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}


async function sendEmailChangePassword(to) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px 30px 0 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <img src="https://res.cloudinary.com/dehehzz2t/image/upload/v1745308686/omgnice_1_uvmup0.png" alt="OMGNICE Logo" style="display: block; height: 180px; width: auto;">
                  </td>
                </tr>
                <tr>
                  <td>
                    <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Password Change Notification</h1>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">Hello,</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">We're reaching out to let you know that your password for <strong>OMGNICE</strong> has been successfully changed.</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">If you requested this change, you can now log in with your new password. No further action is required.</p>
                    <p style="color: #555555; font-size: 16px; line-height: 24px; margin: 0 0 20px 0; background-color: #fef9e7; padding: 15px; border-left: 4px solid #f39c12; border-radius: 4px;">
                      <strong>Important:</strong> If you did NOT request this password change, please contact our support team immediately at <a href="mailto:support@omgnice.com" style="color: #e67e22; text-decoration: none;">support@omgnice.com</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 20px 0; border-top: 1px solid #eeeeee; color: #777777; font-size: 14px; line-height: 22px; text-align: center;">
                    <p style="margin: 0 0 10px 0;">Need help? Contact our support team</p>
                    <a href="mailto:support@omgnice.com" style="color: #e67e22; text-decoration: none;">support@omgnice.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #999999; font-size: 12px; line-height: 18px; text-align: center; padding-top: 10px;">
                    <p style="margin: 0;">© 2025 OMGNICE. All rights reserved.</p>
                    <p style="margin: 10px 0 0 0;">
                      <a href="#" style="color: #999999; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                      <a href="#" style="color: #999999; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: "omgniceten@gmail.com",
      to,
      subject: "[OMGNICE] - Password Change Notification",
      text: "Your password has been changed. If you did not request the password change, please contact our support team immediately at support@omgnice.com.",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
/**
 * Gửi email từ form liên hệ
 * @param {Object} formData - Thông tin form gồm name, email, message
 * @param {Function} [callback] - Callback optional (error, info)
 */
const sendContact = async (formData, callback) => {
  const { fullname, email, phoneNumber, message, subject, attachment } =
    formData || {};

  // Kiểm tra dữ liệu đầu vào
  if (!fullname || !email || !message) {
    const error = new Error("Missing required form fields");
    if (callback) return callback(error, null);
    else throw error;
  }

  const mailOptions = {
    from: '"OMG Nice Feedback" <omgniceten@gmail.com>',
    to: "omgniceten@gmail.com",
    subject: `Feedback from ${fullname} (${email})`,
    text: `
New contact form submission:

Name: ${fullname}
Email: ${email}
${phoneNumber ? `Phone: ${phoneNumber}` : ''}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}
  `,
    html: `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Contact Submission</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <!-- Wrapper Table for Email Clients -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
    <tr>
      <td style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e88e5, #42a5f5); padding: 32px 24px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 500; letter-spacing: 0.5px; line-height: 1.3;">
                New Contact Submission
              </h2>
              <p style="color: #e3f2fd; margin: 8px 0 0; font-size: 14px; font-weight: 400;">
                Received from your website contact form
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              
              <!-- Contact Information Table -->
              <table role="presentation" cellpadding="12" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="font-weight: 600; color: #212121; width: 120px; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Name:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    ${fullname}
                  </td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Email:
                  </td>
                  <td style="padding: 12px 0;">
                    <a href="mailto:${email}" style="color: #1e88e5; text-decoration: none; font-size: 15px; font-weight: 500;">
                      ${email}
                    </a>
                  </td>
                </tr>
                ${phoneNumber ? `
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Phone:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    <a href="tel:${phoneNumber}" style="color: #1e88e5; text-decoration: none; font-weight: 500;">
                      ${phoneNumber}
                    </a>
                  </td>
                </tr>
                ` : ''}
                ${subject ? `
                <tr>
                  <td style="font-weight: 600; color: #212121; font-size: 15px; vertical-align: top; padding: 12px 12px 12px 0;">
                    Subject:
                  </td>
                  <td style="color: #424242; font-size: 15px; padding: 12px 0;">
                    ${subject}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="font-weight: 600; color: #212121; vertical-align: top; font-size: 15px; padding: 12px 12px 12px 0;">
                    Message:
                  </td>
                  <td style="padding: 12px 0;">
                    <div style="background: #fafafa; border-radius: 10px; padding: 16px; color: #37474f; font-size: 14px; line-height: 1.8; white-space: pre-line; border: 1px solid #eceff1; word-wrap: break-word; overflow-wrap: break-word;">
                      ${message}
                    </div>
                  </td>
                </tr>
              </table>

              ${attachment ? `
              <!-- Attachment Section -->
              <div style="margin-top: 24px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 10px; padding: 16px;">
                <div style="color: #1565c0; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
                  📎 Attachment:
                </div>
                <div style="color: #1976d2; font-size: 14px;">
                  ${attachment.originalname}
                </div>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <!--[if mso]>
                  <td style="width: 48%; text-align: center;">
                  <![endif]-->
                  <td style="width: 48%; text-align: center; display: inline-block; vertical-align: top;">
                    <a href="mailto:${email}" style="background: #1e88e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">
                      Reply
                    </a>
                  </td>
                  <!--[if mso]>
                  </td>
                  <td style="width: 4%;"></td>
                  <td style="width: 48%; text-align: center;">
                  <![endif]-->
                  <td style="width: 48%; text-align: center; display: inline-block; vertical-align: top;">
                    ${phoneNumber ? `<a href="tel:${phoneNumber}" style="background: #4caf50; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">Call</a>` : `<a href="#" style="background: #6c757d; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; min-width: 100px; text-align: center;">Archive</a>`}
                  </td>
                  <!--[if mso]>
                  </td>
                  <![endif]-->
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #eceff1; padding: 24px; text-align: center; border-top: 1px solid #dfe4ea;">
              <p style="margin: 0; font-size: 12px; color: #78909c; font-weight: 400;">
                This email was sent from the contact form on your website.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px;">
                <a href="https://yourwebsite.com" style="color: #1e88e5; text-decoration: none; font-weight: 500;">Visit Website</a>
              </p>
              <div style="margin-top: 12px; font-size: 11px; color: #9e9e9e;">
                Received on ${new Date().toLocaleString('vi-VN', { 
                  timeZone: 'Asia/Ho_Chi_Minh',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>
    `,
    attachments: attachment
      ? [
          {
            filename: attachment.originalname,
            content: attachment.buffer,
            contentType: attachment.mimetype,
          },
        ]
      : [],
  };

  try {
    console.log("[sendContact] Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("[sendContact] Email sent successfully!");
    console.log("[sendContact] Message ID:", info.messageId);

    if (callback) return callback(null, info);
    return info;
  } catch (error) {
    console.error("[sendContact] ❌ Failed to send email:", error);
    if (callback) return callback(error, null);
    throw error;
  }
};
module.exports = {
  sendOtpVerifyAccount,
  sendOtpResetPW,
  sendEmailChangePassword,
  sendContact,
};
