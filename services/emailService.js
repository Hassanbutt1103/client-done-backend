const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Configure email transporter based on environment
      // Always use Gmail if credentials are provided, otherwise use test
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Real Gmail SMTP
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        console.log('📧 Email service initialized with Gmail:', process.env.EMAIL_USER);
      } else {
        // Development: Use Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Email service initialized with test account:', testAccount.user);
        console.log('💡 To use real Gmail, set EMAIL_USER and EMAIL_PASS in .env file');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const resetUrl = `${process.env.SERVER_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"VP Engenharia Admin" <admin@vpengenharia.com>',
        to: email,
        subject: 'Password Reset Request - VP Engenharia',
        html: this.generatePasswordResetHTML(userName, resetUrl, resetToken)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Test email sent. Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      console.log(`✅ Password reset email sent to: ${email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  generatePasswordResetHTML(userName, resetUrl, token) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Password Reset - VP Engenharia</title>
        <style>
          /* Modern Email Reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0c1527 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0c1527 100%);
            background-attachment: fixed;
            color: #f8fafc;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            min-height: 100vh;
          }
          
          .email-wrapper {
            width: 100%;
            padding: 40px 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .main-container {
            max-width: 650px;
            width: 100%;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(148, 163, 184, 0.1);
            border: 1px solid rgba(51, 65, 85, 0.8);
          }
          
          /* Header Section */
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
            padding: 40px 40px 50px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shine 3s ease-in-out infinite;
          }
          
          @keyframes shine {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, -50%) rotate(180deg); }
          }
          
          .logo {
            position: relative;
            z-index: 2;
          }
          
          .logo h1 {
            color: #ffffff;
            font-size: 36px;
            font-weight: 800;
            margin: 0;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            letter-spacing: -0.5px;
          }
          
          .logo-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin-top: 8px;
            font-weight: 500;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .header-icon {
            font-size: 48px;
            margin-bottom: 20px;
            display: block;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }
          
          /* Content Sections */
          .content-wrapper {
            padding: 0;
          }
          
          .section {
            padding: 32px 40px;
            border-bottom: 1px solid rgba(51, 65, 85, 0.3);
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          /* Welcome Section */
          .welcome-section {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.4) 100%);
          }
          
          .welcome-title {
            color: #f1f5f9;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .welcome-text {
            color: #e2e8f0;
            font-size: 18px;
            line-height: 1.7;
            margin-bottom: 16px;
          }
          
          .user-name {
            color: #60a5fa;
            font-weight: 600;
          }
          
          /* Action Section */
          .action-section {
            background: rgba(51, 65, 85, 0.2);
            text-align: center;
          }
          
          .action-title {
            color: #f1f5f9;
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          
          .action-description {
            color: #cbd5e1;
            font-size: 16px;
            margin-bottom: 32px;
            line-height: 1.6;
          }
          
          .button-container {
            margin: 32px 0;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff !important;
            padding: 18px 36px;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 700;
            font-size: 18px;
            text-align: center;
            box-shadow: 
              0 8px 16px rgba(59, 130, 246, 0.3),
              0 4px 8px rgba(59, 130, 246, 0.2);
            transition: all 0.3s ease;
            min-width: 240px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }
          
          .button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          
          .button:hover::before {
            left: 100%;
          }
          
          .button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            box-shadow: 
              0 12px 24px rgba(59, 130, 246, 0.4),
              0 6px 12px rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
          }
          
          /* Token Info Section */
          .token-section {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
          }
          
          .section-title {
            color: #60a5fa;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .token-info {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #334155;
            box-shadow: 
              0 8px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(148, 163, 184, 0.1);
            position: relative;
          }
          
          .token-grid {
            display: grid;
            gap: 20px;
          }
          
          .token-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: rgba(51, 65, 85, 0.3);
            border-radius: 12px;
            border-left: 4px solid #60a5fa;
          }
          
          .token-label {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .token-value {
            color: #f1f5f9;
            font-size: 16px;
            font-weight: 600;
          }
          
          .token-code {
            background: linear-gradient(135deg, #000000 0%, #1f2937 100%);
            color: #fbbf24;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid #374151;
            word-break: break-all;
            line-height: 1.5;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
            position: relative;
          }
          
          .token-code::before {
            content: 'TOKEN';
            position: absolute;
            top: -8px;
            left: 12px;
            background: #000000;
            color: #94a3b8;
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          
          /* Security Warning Section */
          .security-section {
            background: linear-gradient(135deg, rgba(127, 29, 29, 0.4) 0%, rgba(153, 27, 27, 0.2) 100%);
          }
          
          .warning-card {
            background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
            padding: 24px;
            border-radius: 16px;
            border-left: 4px solid #ef4444;
            box-shadow: 0 8px 16px rgba(127, 29, 29, 0.3);
          }
          
          .warning-title {
            color: #fecaca;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .warning-list {
            color: #fef2f2;
            font-size: 15px;
            line-height: 1.7;
            list-style: none;
            padding: 0;
          }
          
          .warning-list li {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }
          
          .warning-list li::before {
            content: '•';
            color: #f87171;
            font-weight: bold;
            font-size: 18px;
            line-height: 1;
          }
          
          /* Alternative Access Section */
          .alternative-section {
            background: rgba(71, 85, 105, 0.2);
          }
          
          .link-fallback {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            padding: 20px;
            border-radius: 12px;
            margin: 16px 0;
            word-break: break-all;
            font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', monospace;
            font-size: 14px;
            color: #60a5fa;
            border: 1px solid #6b7280;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          /* Footer */
          .footer {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid rgba(51, 65, 85, 0.5);
          }
          
          .footer-content {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .footer-brand {
            color: #e2e8f0;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .footer-copyright {
            margin-top: 16px;
            font-size: 12px;
            color: #64748b;
            opacity: 0.8;
          }
          
          /* Mobile Responsive */
          @media only screen and (max-width: 640px) {
            .email-wrapper {
              padding: 20px 10px;
            }
            
            .main-container {
              border-radius: 16px;
            }
            
            .header {
              padding: 32px 24px 40px;
            }
            
            .header-icon {
              font-size: 40px;
              margin-bottom: 16px;
            }
            
            .logo h1 {
              font-size: 28px;
            }
            
            .logo-subtitle {
              font-size: 14px;
            }
            
            .section {
              padding: 24px 24px;
            }
            
            .welcome-title {
              font-size: 24px;
            }
            
            .welcome-text {
              font-size: 16px;
            }
            
            .action-title {
              font-size: 20px;
            }
            
            .button {
              padding: 16px 28px;
              font-size: 16px;
              min-width: 200px;
            }
            
            .token-info {
              padding: 20px;
            }
            
            .token-item {
              padding: 12px;
            }
            
            .token-code {
              font-size: 12px;
              padding: 10px 12px;
            }
            
            .footer {
              padding: 24px;
            }
          }
          
          @media only screen and (max-width: 480px) {
            .header {
              padding: 24px 20px 32px;
            }
            
            .section {
              padding: 20px;
            }
            
            .welcome-title {
              font-size: 22px;
              flex-direction: column;
              text-align: center;
            }
            
            .button {
              padding: 14px 24px;
              font-size: 15px;
              min-width: 180px;
            }
            
            .token-code {
              font-size: 11px;
              padding: 8px 10px;
            }
          }
          
          /* High Contrast Support */
          @media (prefers-contrast: high) {
            .main-container {
              border: 3px solid #60a5fa;
            }
            
            .button {
              border: 3px solid #ffffff;
            }
            
            .token-code {
              background: #000000 !important;
              color: #ffff00 !important;
              border: 2px solid #ffffff;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="main-container">
            <!-- Header Section -->
            <div class="header">
              <div class="logo">
                <span class="header-icon">🔐</span>
                <h1>VP Engenharia</h1>
                <div class="logo-subtitle">Admin Security Portal</div>
              </div>
            </div>
            
            <div class="content-wrapper">
              <!-- Welcome Section -->
              <div class="section welcome-section">
                <h2 class="welcome-title">
                  <span>🔑</span>
                  <span>Password Reset Request</span>
                </h2>
                <p class="welcome-text">
                  Hello <span class="user-name">${userName}</span>,
                </p>
                <p class="welcome-text">
                  We received a secure request to reset your VP Engenharia admin account password. 
                  This email contains everything you need to safely update your credentials.
                </p>
              </div>
              
              <!-- Action Section -->
              <div class="section action-section">
                <h3 class="action-title">Reset Your Password</h3>
                <p class="action-description">
                  Click the secure button below to access the password reset form. 
                  This link is encrypted and will expire in 15 minutes for your security.
                </p>
                
                <div class="button-container">
                  <a href="${resetUrl}" class="button">
                    🔓 Reset Password Securely
                  </a>
                </div>
              </div>
              
              <!-- Token Information Section -->
              <div class="section token-section">
                <h3 class="section-title">
                  <span>🎫</span>
                  <span>Security Token Details</span>
                </h3>
                
                <div class="token-info">
                  <div class="token-grid">
                    <div class="token-item">
                      <span class="token-label">🎫 Reset Token</span>
                      <div class="token-code">${token}</div>
                    </div>
                    
                    <div class="token-item">
                      <span class="token-label">⏰ Valid Until</span>
                      <span class="token-value">15 minutes from now</span>
                    </div>
                    
                    <div class="token-item">
                      <span class="token-label">🔒 Usage Policy</span>
                      <span class="token-value">Single use only - token becomes invalid after first use</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Security Warning Section -->
              <div class="section security-section">
                <h3 class="section-title">
                  <span>⚠️</span>
                  <span>Important Security Notice</span>
                </h3>
                
                <div class="warning-card">
                  <div class="warning-title">
                    <span>🛡️</span>
                    <span>Security Guidelines</span>
                  </div>
                  <ul class="warning-list">
                    <li><strong>Time Sensitive:</strong> This link expires in exactly 15 minutes</li>
                    <li><strong>One-Time Use:</strong> Token becomes invalid after password reset</li>
                    <li><strong>No Request Made?</strong> Simply ignore this email - your password remains secure</li>
                    <li><strong>Keep Private:</strong> Never share this email or token with anyone</li>
                    <li><strong>Suspicious Activity?</strong> Contact your system administrator immediately</li>
                  </ul>
                </div>
              </div>
              
              <!-- Alternative Access Section -->
              <div class="section alternative-section">
                <h3 class="section-title">
                  <span>🔗</span>
                  <span>Alternative Access</span>
                </h3>
                <p class="action-description">
                  If the button above doesn't work, copy and paste this secure link into your browser:
                </p>
                <div class="link-fallback">${resetUrl}</div>
                <p class="action-description" style="margin-top: 16px;">
                  <strong>Need assistance?</strong> Contact your system administrator for immediate support.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <div class="footer-brand">VP Engenharia Admin System</div>
                <div>This is an automated security message from a monitored system.</div>
                <div>Please do not reply to this email address.</div>
                <div class="footer-copyright">
                  © ${new Date().getFullYear()} VP Engenharia. All rights reserved. | Secure Email Service
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
module.exports = new EmailService(); 