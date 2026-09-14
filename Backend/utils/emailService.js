const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transport instance based on environment variables.
 * Supports standard services (e.g. Gmail) or custom SMTP host/port.
 */
const createTransporter = () => {
  const service = process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

/**
 * Send an email with graceful fallback to console logging for local testing.
 *
 * @param {Object} options - { to, subject, html, text }
 * @returns {Promise<boolean>} - true if sent or logged successfully
 */
const sendMail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || 'SamadhanSetu <no-reply@samadhansetu.gov.in>';
  const transporter = createTransporter();

  // If credentials are not configured, print to console for development/hackathon testing
  if (!transporter) {
    console.log('\n======================================================');
    console.log(' [EMAIL SERVICE - DEVELOPMENT FALLBACK (NO SMTP)]');
    console.log(` To:      ${to}`);
    console.log(` Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text || html);
    console.log('======================================================\n');
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(` Email sent successfully to ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(` Error sending email to ${to}:`, error.message);
    console.log('\n----------------- FALLBACK LOG -----------------');
    console.log(` To:      ${to}`);
    console.log(` Subject: ${subject}`);
    console.log(text || html);
    console.log('------------------------------------------------\n');
    return false;
  }
};

/**
 * Send Email Verification link to newly registered user
 */
const sendVerificationEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email/${token}`;

  const subject = 'Verify Your Email - SamadhanSetu';
  const text = `Hello ${name},

Welcome to SamadhanSetu! Please verify your email address to complete your registration and activate all features on the platform.

Verification Link: ${verificationLink}

This link is valid for 24 hours. If you did not create this account, please ignore this email.

Best regards,
The SamadhanSetu Team
Government of Jharkhand Initiative`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #059669 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">SamadhanSetu</h1>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Government of Jharkhand Civic Innovation Initiative</p>
      </div>
      <div style="padding: 28px; color: #1e293b;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Email Verification Required</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Thank you for registering on <strong>SamadhanSetu</strong>. To verify your email address and unlock full platform capabilities, please click the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verificationLink}" style="color: #0284c7; word-break: break-all;">${verificationLink}</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          This verification link is valid for <strong>24 hours</strong>. If you did not create this account, no action is required.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        SamadhanSetu &bull; Problem ID: SIH26043 &bull; Government of Jharkhand
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Send Welcome Email after successful registration/verification
 */
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to SamadhanSetu';

  const text = `Hello ${name},

Welcome to SamadhanSetu!

SamadhanSetu is a Government of Jharkhand aligned digital problem-solving platform designed to connect citizens, universities, industry partners and government institutions.

- It helps citizens report real societal problems.
- Universities and students can work on verified challenges.
- Industry partners can contribute technology, expertise and implementation support.
- Government administrators review and manage problems to maintain accountability.

"Your problem matters. SamadhanSetu helps connect real challenges with people and institutions capable of creating real solutions."

We are glad to have you with us on this collaborative mission.

Best regards,
The SamadhanSetu Team
Government of Jharkhand Initiative`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #059669 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">SamadhanSetu</h1>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Government of Jharkhand Civic Innovation Platform</p>
      </div>
      <div style="padding: 28px; color: #1e293b;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Welcome to SamadhanSetu, ${name}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          SamadhanSetu is a Government of Jharkhand aligned digital problem-solving platform designed to connect citizens, universities, industry partners and government institutions.
        </p>

        <div style="background-color: #f1f5f9; border-left: 4px solid #059669; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #0f172a; font-style: italic; font-weight: 500;">
            "Your problem matters. SamadhanSetu helps connect real challenges with people and institutions capable of creating real solutions."
          </p>
        </div>

        <h3 style="font-size: 15px; color: #334155; margin-bottom: 8px;">How Our Ecosystem Works:</h3>
        <ul style="font-size: 13px; color: #475569; line-height: 1.8; padding-left: 20px; margin: 0;">
          <li><strong>Citizens:</strong> Report real societal challenges directly to problem solvers.</li>
          <li><strong>Universities:</strong> Students and researchers develop practical, innovative prototypes for verified challenges.</li>
          <li><strong>Industry Partners:</strong> Contribute domain expertise, technology, and commercial implementation support.</li>
          <li><strong>Government Administrators:</strong> Review and manage problem lifecycle to ensure accountability and community impact.</li>
        </ul>

        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 24px;">
          Thank you for joining our mission to empower grassroots problem-solving!
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        SamadhanSetu &bull; Problem ID: SIH26043 &bull; Government of Jharkhand
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

/**
 * Send Password Reset link email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password/${token}`;

  const subject = 'Password Reset Request - SamadhanSetu';
  const text = `Hello ${name || 'User'},

We received a request to reset the password for your SamadhanSetu account.

Reset your password using the link below:
${resetLink}

This link is valid for 1 hour.

If you did not request a password reset, please ignore this email or contact support. Your password will remain unchanged.

Best regards,
The SamadhanSetu Team
Government of Jharkhand Initiative`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #059669 100%); padding: 24px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold;">SamadhanSetu</h1>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Password Assistance</p>
      </div>
      <div style="padding: 28px; color: #1e293b;">
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Hello <strong>${name || 'User'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          We received a request to reset your password for your SamadhanSetu account. Click the button below to choose a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Or copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color: #0284c7; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          This password reset link is valid for <strong>1 hour</strong>. If you did not request this, please disregard this email.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        SamadhanSetu &bull; Problem ID: SIH26043 &bull; Government of Jharkhand
      </div>
    </div>
  `;

  return sendMail({ to: email, subject, text, html });
};

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
