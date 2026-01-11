import { Resend } from 'resend';
import {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
  welcomeToEmailTemplate,
} from './email-templates';

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
    console.log(`Subject: Please confirm your registration`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to verify your email:\n`);
    console.log(`🔗 ${verificationUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email with styled template
  return sendEmail(
    email,
    'Please confirm your registration',
    verificationEmailTemplate(username, verificationUrl)
  );
}

/**
 * Send welcome email (after verification)
 * @param email - User's email address
 * @param username - User's username
 */
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean> {
  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 WELCOME EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Email Confirmed - Welcome to Fotolokashen!`);
    console.log(`\nHi ${username},\n`);
    console.log(`Your email has been confirmed! Welcome to Fotolokashen.`);
    console.log(`\nStart adding locations, photos, and building your projects!`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email with styled template
  return sendEmail(
    email,
    'Email Confirmed - Welcome to Fotolokashen!',
    welcomeToEmailTemplate(username)
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

  // Send actual email with styled template
  return sendEmail(
    email,
    'Reset your password',
    passwordResetEmailTemplate(username, resetUrl)
  );
}

/**
 * Send password changed notification email
 * @param email - User's email address
 * @param username - User's username
 * @param ipAddress - IP address where change occurred
 * @param timestamp - When the change occurred
 * @param userTimezone - User's timezone preference (optional)
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string,
  ipAddress: string | null,
  timestamp: Date,
  userTimezone?: string | null
): Promise<boolean> {
  // Format timestamp in user's timezone if available, otherwise UTC
  const timezone = userTimezone || 'UTC';

  const formattedTime = timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
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

  // Send actual email with styled template
  return sendEmail(
    email,
    'Your Password Was Changed',
    passwordChangedEmailTemplate(username, formattedTime, ipAddress)
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

  // Send actual email with styled template
  return sendEmail(
    email,
    'We deleted your Fotolokashen account',
    accountDeletionEmailTemplate(username, email)
  );
}
