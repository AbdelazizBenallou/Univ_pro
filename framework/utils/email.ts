import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
});

export const emailUtils = {
  async sendVerificationCode(email: string, code: string): Promise<void> {
    await transporter.sendMail({
      from: '"Univ-Pro" <benallouaziz1414@gmail.com>',
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; text-align: center;">
          <h2 style="color: #333;">Univ-Pro Verification</h2>
          <p style="color: #666; font-size: 14px;">Your verification code is:</p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 5 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  },
};
