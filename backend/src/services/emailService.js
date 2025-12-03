'use strict';

const { Resend } = require('resend');

/**
 * Email Service
 * Handles sending emails using Resend API
 * 
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get your API key from the dashboard
 * 3. Set RESEND_API_KEY in your environment variables
 * 4. For production, verify your own domain in Resend dashboard
 * 
 * Note: The test domain (onboarding@resend.dev) only sends to your verified email
 * To send to any email, you need to verify your own domain (free, takes ~5 minutes)
 */

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
// Use onboarding@resend.dev for testing, or your verified domain for production
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = 'Rewardly';

/**
 * Send activation email to new user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} activationUrl - Full activation URL
 * @param {Date} expiresAt - Expiration date
 */
async function sendActivationEmail(email, name, activationUrl, expiresAt) {
  const emailContent = {
    subject: 'Welcome to Rewardly - Activate Your Account',
    html: `
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
    `,
    text: `
Welcome to Rewardly!

Hi ${name},

Your Rewardly account has been created. To get started, please activate your account by setting your password.

Click this link to activate: ${activationUrl}

This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

If you didn't request this account, please ignore this email.

© ${new Date().getFullYear()} Rewardly. All rights reserved.
    `
  };

  try {
    console.log('📧 Sending activation email to:', email);
    console.log('   From:', `${FROM_NAME} <${FROM_EMAIL}>`);
    
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Activation email sent successfully!');
    console.log('   Email ID:', data.id);
    console.log('   To:', email);
    
    return { 
      success: true, 
      sent: true,
      messageId: data.id
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
  const emailContent = {
    subject: 'Reset Your Rewardly Password',
    html: `
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
    `,
    text: `
Password Reset Request

Hi ${name},

We received a request to reset your password for your Rewardly account.

Click this link to reset your password: ${resetUrl}

This link expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Rewardly. All rights reserved.
    `
  };

  try {
    console.log('📧 Sending password reset email to:', email);
    console.log('   From:', `${FROM_NAME} <${FROM_EMAIL}>`);
    
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('   Email ID:', data.id);
    console.log('   To:', email);
    
    return { 
      success: true, 
      sent: true,
      messageId: data.id
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

