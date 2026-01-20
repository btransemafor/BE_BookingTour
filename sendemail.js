const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'omgniceten@gmail.com',
    pass: 'kkptczknvlpyqism' 
  }
});

async function sendMail(to, subject, htmlContent) {
  const mailOptions = {
    from: 'omgniceten@gmail.com',
    to,
    subject,
    html: htmlContent
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
}

module.exports = sendMail;
