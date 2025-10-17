import nodemailer from 'nodemailer'
import { config } from './config'
import { logger } from './logger'

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null

function createTransporter() {
  if (!config.SMTP_HOST || !config.SMTP_PORT || !config.SMTP_USER || !config.SMTP_PASS) {
    logger.warn('SMTP configuration incomplete. Email functionality will be disabled.')
    return null
  }

  const transportConfig = {
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: Number(config.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates in development
    }
  } as const

  return nodemailer.createTransport(transportConfig as any)
}

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter()
  }
  return transporter
}

export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  resetToken: string
): Promise<void> {
  const emailTransporter = getTransporter()
  
  if (!emailTransporter) {
    logger.error('Email transporter not configured. Cannot send password reset email.')
    throw new Error('Email service not configured')
  }

  const resetUrl = `${config.NEXTAUTH_URL}/reset-password?token=${resetToken}`
  
  const mailOptions = {
    from: config.FROM_EMAIL || config.SMTP_USER,
    to: email,
    subject: 'Reset Your ChainProof AI Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e1e5e9;
              border-top: none;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border: 1px solid #e1e5e9;
              border-top: none;
              border-radius: 0 0 8px 8px;
              font-size: 14px;
              color: #6c757d;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 ChainProof AI</h1>
            <p>Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>We received a request to reset your password for your ChainProof AI account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 30 minutes for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            
            <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
            
            <p>Best regards,<br>The ChainProof AI Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} ChainProof AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Hello ${name},

We received a request to reset your password for your ChainProof AI account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The ChainProof AI Team

This email was sent to ${email}.
    `
  }

  try {
    await emailTransporter.sendMail(mailOptions)
    logger.info('Password reset email sent successfully', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for logging
    })
  } catch (error) {
    logger.error('Failed to send password reset email', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    throw error
  }
}

export async function sendWelcomeEmail(
  email: string, 
  name: string
): Promise<void> {
  const emailTransporter = getTransporter()
  
  if (!emailTransporter) {
    logger.warn('Email transporter not configured. Cannot send welcome email.')
    return
  }

  const mailOptions = {
    from: config.FROM_EMAIL || config.SMTP_USER,
    to: email,
    subject: 'Welcome to ChainProof AI!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ChainProof AI</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e1e5e9;
              border-top: none;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border: 1px solid #e1e5e9;
              border-top: none;
              border-radius: 0 0 8px 8px;
              font-size: 14px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 Welcome to ChainProof AI!</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${name},</h2>
            
            <p>Welcome to ChainProof AI! We're excited to have you on board.</p>
            
            <p>With ChainProof AI, you can:</p>
            <ul>
              <li>🔍 Audit smart contracts for vulnerabilities</li>
              <li>📊 Get detailed security reports</li>
              <li>🛡️ Ensure your code meets security standards</li>
              <li>📈 Track your audit history and improvements</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${config.NEXTAUTH_URL}/dashboard" class="button">Get Started</a>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The ChainProof AI Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ChainProof AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `
  }

  try {
    await emailTransporter.sendMail(mailOptions)
    logger.info('Welcome email sent successfully', { 
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
  } catch (error) {
    logger.error('Failed to send welcome email', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    })
    // Don't throw error for welcome emails as they're not critical
  }
}