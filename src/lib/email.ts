import { Resend } from 'resend';

// Environment variables
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_MODE = process.env.EMAIL_MODE || 'development';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;

// Initialize Resend client (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && EMAIL_API_KEY) {
    resendClient = new Resend(EMAIL_API_KEY);
  }
  if (!resendClient) {
    throw new Error('Resend API key is not configured. Set EMAIL_API_KEY in environment variables.');
  }
  return resendClient;
}

/**
 * Send email using Resend API
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @returns Promise<boolean> - Success status
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const fromName = process.env.EMAIL_FROM_NAME || 'Fotolokashen';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@fotolokashen.com';

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
}

/**
 * Send email verification email
 * @param email - User's email address
 * @param token - Verification token
 * @param username - User's username
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  // In development mode, just log the URL to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 VERIFICATION EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to verify your email:\n`);
    console.log(`🔗 ${verificationUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email via configured service
  return sendEmail(
    email,
    'Verify your email address',
    `
      <h2>Welcome to Fotolokashen!</h2>
      <p>Hi ${username},</p>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  );
}

/**
 * Send password reset email
 * @param email - User's email address
 * @param token - Reset token
 * @param username - User's username
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  // In development mode, just log the URL to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 PASSWORD RESET EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Reset your password`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to reset your password:\n`);
    console.log(`🔗 ${resetUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email via configured service
  return sendEmail(
    email,
    'Reset your password',
    `
      <h2>Password Reset Request</h2>
      <p>Hi ${username},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p><strong>This link will expire in 15 minutes.</strong></p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p style="color: #666; font-size: 12px;">For security: Never share this link with anyone.</p>
    `
  );
}

/**
 * Send password changed notification email
 * @param email - User's email address
 * @param username - User's username
 * @param ipAddress - IP address where change occurred
 * @param timestamp - When the change occurred
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string,
  ipAddress: string | null,
  timestamp: Date
): Promise<boolean> {
  const formattedTime = timestamp.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('✅ PASSWORD CHANGED NOTIFICATION (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Your password was changed`);
    console.log(`\nHi ${username},\n`);
    console.log(`Your password was successfully changed on ${formattedTime}`);
    if (ipAddress) {
      console.log(`IP Address: ${ipAddress}`);
    }
    console.log(`\nIf you didn't make this change, contact: admin@fotolokashen.com`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email via configured service
  return sendEmail(
    email,
    'Your Password Was Changed',
    `
      <h2>Password Changed</h2>
      <p>Hi ${username},</p>
      <p>Your password was successfully changed on <strong>${formattedTime}</strong>.</p>
      ${ipAddress ? `<p>IP Address: <code>${ipAddress}</code></p>` : ''}
      <p>If you made this change, no further action is needed.</p>
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
        <strong>⚠️ If you did NOT make this change:</strong>
        <ol style="margin: 10px 0;">
          <li>Someone may have unauthorized access to your account</li>
          <li>Contact our support team immediately at <a href="mailto:admin@fotolokashen.com">admin@fotolokashen.com</a></li>
          <li>We recommend securing your email account as well</li>
        </ol>
      </div>
      <p>For your security, all active sessions have been logged out.</p>
      <p style="color: #666; font-size: 12px;">This is an automated security notification.</p>
    `
  );
}

/**
 * Send account deletion notification email
 * @param email - User's email address
 * @param username - User's username or full name
 */
export async function sendAccountDeletionEmail(
  email: string,
  username: string
): Promise<boolean> {
  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  ACCOUNT DELETION NOTIFICATION (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: We deleted your fotolokashen account `);
    console.log(`\nHi ${username},\n`);
    console.log(`We have removed your account (${email}) entirely.`);
    console.log(`This deletion removed all personal information,`);
    console.log(`photos, and metadata related to your account.`);
    console.log(`\nAt any time you may register again.`);
    console.log(`\n- MV Team`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email via configured service
  return sendEmail(
    email,
    'We deleted your Fotolokashen account',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Account Deletion Notification</h2>
        <p>Hi ${username},</p>
        <p>We have removed your account <strong>${email}</strong> entirely.</p>
        <p>This means we have permanently deleted all personal information, photos, and metadata related to your account.</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 16px; margin: 24px 0;">
          <p style="margin: 0;"><strong>What was deleted:</strong></p>
          <ul style="margin: 8px 0;">
            <li>Your profile and account information</li>
            <li>All uploaded photos and images</li>
            <li>All locations and saved places</li>
            <li>All session data and preferences</li>
          </ul>
        </div>
        <p>At any time you may register again at <a href="${APP_URL}/register">${APP_URL}/register</a>.</p>
        <p style="margin-top: 32px;">- MV Team</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification. If you have questions, please contact us at 
          <a href="mailto:admin@fotolokashen.com">admin@fotolokashen.com</a>.
        </p>
      </div>
    `
  );
}
