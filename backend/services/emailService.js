const nodemailer = require("nodemailer");

// ── Create reusable transporter ──────────────────────────────────────
//const nodemailer = require("nodemailer");

// ── Create reusable transporter ──────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,  // 10s to establish connection
    greetingTimeout: 10000,    // 10s for SMTP greeting
    socketTimeout: 15000,      // 15s for socket inactivity
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for Pro plan activation
 */
const sendOTPEmail = async (recipientEmail, otp, userName, paymentDetails) => {
  const transporter = createTransporter();

  const maskedCard = paymentDetails.cardNumber
    ? "**** **** **** " + paymentDetails.cardNumber.slice(-4)
    : "N/A";

  const mailOptions = {
    from: `"AI Income Tracker" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "🔐 OTP Verification — Pro Plan Activation",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 AI Income Tracker</h1>
          <p style="color: #e0d4f7; margin: 10px 0 0; font-size: 14px;">Pro Plan Activation</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            You are upgrading to the <strong style="color: #764ba2;">Pro Plan</strong>. 
            Please use the OTP below to complete your activation:
          </p>
          
          <!-- OTP Box -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 40px; border-radius: 12px;">
              <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <p style="color: #e74c3c; font-size: 13px; text-align: center;">⏰ This OTP expires in <strong>10 minutes</strong></p>
          
          <!-- Payment Summary -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #764ba2;">
            <h3 style="color: #333; margin: 0 0 12px; font-size: 15px;">📋 Payment Summary</h3>
            <table style="width: 100%; font-size: 14px; color: #555;">
              <tr><td style="padding: 4px 0;">Plan:</td><td style="text-align: right; font-weight: bold;">${paymentDetails.duration === "yearly" ? "Yearly" : "Monthly"} Pro</td></tr>
              <tr><td style="padding: 4px 0;">Amount:</td><td style="text-align: right; font-weight: bold; color: #27ae60;">$${paymentDetails.amount}</td></tr>
              <tr><td style="padding: 4px 0;">Card:</td><td style="text-align: right;">${maskedCard}</td></tr>
              <tr><td style="padding: 4px 0;">Phone:</td><td style="text-align: right;">${paymentDetails.phoneNumber || "N/A"}</td></tr>
            </table>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} AI Income Tracker | All rights reserved
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("OTP email sent:", info.messageId);
  return info;
};

/**
 * Send Pro activation success email
 */
const sendActivationSuccessEmail = async (recipientEmail, userName, planDetails) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"AI Income Tracker" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "🎉 Pro Plan Activated Successfully!",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Welcome to Pro!</h1>
          <p style="color: #d5f5e3; margin: 10px 0 0; font-size: 14px;">Your upgrade is complete</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="color: #333; font-size: 16px;">Hello <strong>${userName}</strong>,</p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            Your <strong style="color: #27ae60;">Pro Plan</strong> has been activated successfully! 
            You now have access to all premium features.
          </p>
          
          <div style="background: #f0fff4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #27ae60;">
            <h3 style="color: #333; margin: 0 0 12px; font-size: 15px;">✨ Your Pro Features</h3>
            <ul style="color: #555; font-size: 14px; line-height: 2;">
              <li>Unlimited AI requests</li>
              <li>Advanced analytics & category breakdowns</li>
              <li>AI expense predictions</li>
              <li>Personalized budget advice</li>
              <li>Data export</li>
              <li>Priority support</li>
            </ul>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 14px; color: #555;">📅 Plan: <strong>${planDetails.duration}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #555;">💰 Amount: <strong>$${planDetails.amount}</strong></p>
            <p style="margin: 5px 0; font-size: 14px; color: #555;">📆 Expires: <strong>${planDetails.expiresAt}</strong></p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} AI Income Tracker | All rights reserved
          </p>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Activation success email sent:", info.messageId);
  return info;
};

module.exports = { generateOTP, sendOTPEmail, sendActivationSuccessEmail };
