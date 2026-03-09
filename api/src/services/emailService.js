const { Resend } = require('resend');
const { resendApiKey, resendFrom } = require('../config');
const logger = require('../config/logger');

const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendPasswordResetEmail(toEmail, resetUrl, firstName) {
  if (!resend) {
    logger.warn('Resend client not initialized — skipping email send', { toEmail });
    return;
  }

  const { data, error } = await resend.emails.send({
    from: resendFrom,
    to: [toEmail],
    subject: 'รีเซ็ตรหัสผ่าน - SmartFarm',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">SmartFarm</h2>
        <p>สวัสดี ${firstName},</p>
        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #2e7d32; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 6px; font-size: 16px;">
            ตั้งรหัสผ่านใหม่
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง</p>
        <p style="color: #666; font-size: 14px;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยอีเมลนี้</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">SmartFarm - ระบบจัดการฟาร์มอัจฉริยะ</p>
      </div>
    `,
  });

  if (error) {
    logger.error('Failed to send password reset email', { toEmail, error: error.message });
    throw new Error('Failed to send reset email');
  }

  logger.info('Password reset email sent', { toEmail, emailId: data?.id });
}

module.exports = { sendPasswordResetEmail };
