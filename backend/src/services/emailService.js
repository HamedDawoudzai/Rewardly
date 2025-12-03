'use strict';

const SibApiV3Sdk = require('@getbrevo/brevo');

/**
 * Email Service
 * Handles sending emails using Brevo (formerly Sendinblue) API
 * 
 * Setup:
 * 1. Sign up at https://www.brevo.com
 * 2. Go to SMTP & API → API Keys
 * 3. Generate a new API key
 * 4. Set BREVO_API_KEY in your environment variables
 * 
 * Note: Brevo allows sending to ANY email without domain verification!
 * Free tier: 300 emails/day
 */

// Initialize Brevo API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// Email sender configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@rewardly.app';
const FROM_NAME = 'Rewardly';

/**
 * Send activation email to new user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} activationUrl - Full activation URL
 * @param {Date} expiresAt - Expiration date
 */
async function sendActivationEmail(email, name, activationUrl, expiresAt) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = 'Welcome to Rewardly - Activate Your Account';
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: email, name: name }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .link-box { background-color: #eff6ff; padding: 10px; border-radius: 5px; margin: 15px 0; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Rewardly!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Your Rewardly account has been created. To get started, please activate your account by setting your password.</p>
          <p style="text-align: center;">
            <a href="${activationUrl}" class="button">Activate Account</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <p style="margin: 0; color: #1e40af; font-size: 12px;">${activationUrl}</p>
          </div>
          <p><strong>This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</strong></p>
          <p>If you didn't request this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rewardly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.textContent = `
Welcome to Rewardly!

Hi ${name},

Your Rewardly account has been created. To get started, please activate your account by setting your password.

Click this link to activate: ${activationUrl}

This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

If you didn't request this account, please ignore this email.

© ${new Date().getFullYear()} Rewardly. All rights reserved.
  `;

  try {
    console.log('📧 Sending activation email to:', email);
    console.log('   From:', `${FROM_NAME} <${FROM_EMAIL}>`);
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Activation email sent successfully!');
    console.log('   Message ID:', response.messageId);
    console.log('   To:', email);
    
    return { 
      success: true, 
      sent: true,
      messageId: response.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send activation email:', error);
    console.error('   Error details:', error.message);
    
    // Don't throw error - let user creation succeed even if email fails
    // The email can be resent later if needed
    return { 
      success: false, 
      sent: false,
      error: error.message 
    };
  }
}

/**
 * Send password reset email to user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} resetUrl - Full password reset URL
 * @param {Date} expiresAt - Expiration date
 */
async function sendPasswordResetEmail(email, name, resetUrl, expiresAt) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = 'Reset Your Rewardly Password';
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: email, name: name }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .link-box { background-color: #eff6ff; padding: 10px; border-radius: 5px; margin: 15px 0; word-break: break-all; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your Rewardly account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <p style="margin: 0; color: #1e40af; font-size: 12px;">${resetUrl}</p>
          </div>
          <div class="warning">
            <p style="margin: 0; font-weight: bold;">⚠️ This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.</p>
          </div>
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rewardly. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.textContent = `
Password Reset Request

Hi ${name},

We received a request to reset your password for your Rewardly account.

Click this link to reset your password: ${resetUrl}

This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Rewardly. All rights reserved.
  `;

  try {
    console.log('📧 Sending password reset email to:', email);
    console.log('   From:', `${FROM_NAME} <${FROM_EMAIL}>`);
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ Password reset email sent successfully!');
    console.log('   Message ID:', response.messageId);
    console.log('   To:', email);
    
    return { 
      success: true, 
      sent: true,
      messageId: response.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('   Error details:', error.message);
    
    return { 
      success: false, 
      sent: false,
      error: error.message 
    };
  }
}

module.exports = {
  sendActivationEmail,
  sendPasswordResetEmail
};
