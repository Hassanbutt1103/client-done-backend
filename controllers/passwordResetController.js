const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/emailService');

// @desc    Send password reset email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal that the email doesn't exist for security
      return res.status(200).json({
        status: 'success',
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check if user is admin (optional: restrict to admin users only)
    if (user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Password reset is only available for administrator accounts'
      });
    }

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Generate new reset token
    const resetRecord = await PasswordReset.generateResetToken(user._id, user.email);

    // Send email
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email,
      resetRecord.token,
      user.name
    );

    if (!emailResult.success) {
      // Clean up the token if email failed
      await PasswordReset.findByIdAndDelete(resetRecord._id);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    console.log(`📧 Password reset requested for: ${user.email}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset link has been sent to your email address'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error processing password reset request'
    });
  }
};

// @desc    Verify reset token and show reset form
// @route   GET /reset-password
// @access  Public (server-side rendered)
exports.showResetForm = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Reset Link - VP Engenharia</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #1a2a33;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              background-color: #232b3a;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              max-width: 400px;
              border: 1px solid #374151;
            }
            .error {
              color: #ef4444;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid Reset Link</h1>
            <p>The password reset link is missing or invalid.</p>
            <p>Please request a new password reset.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Verify token
    const resetRecord = await PasswordReset.findValidToken(token);
    if (!resetRecord || !resetRecord.userId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Expired Reset Link - VP Engenharia</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #1a2a33;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              background-color: #232b3a;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              max-width: 400px;
              border: 1px solid #374151;
            }
            .error {
              color: #ef4444;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Reset Link Expired</h1>
            <p>This password reset link has expired or has already been used.</p>
            <p>Please request a new password reset.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Show password reset form
    res.send(generateResetFormHTML(token, resetRecord.userId.name, resetRecord.userId.email));
  } catch (error) {
    console.error('❌ Show reset form error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - VP Engenharia</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1a2a33;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background-color: #232b3a;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            border: 1px solid #374151;
          }
          .error {
            color: #ef4444;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Server Error</h1>
          <p>An error occurred while processing your request.</p>
          <p>Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
};

// @desc    Reset password
// @route   POST /reset-password
// @access  Public (server-side rendered)
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).send(generateErrorHTML('Missing required fields'));
    }

    if (password !== confirmPassword) {
      return res.status(400).send(generateErrorHTML('Passwords do not match'));
    }

    if (password.length < 6) {
      return res.status(400).send(generateErrorHTML('Password must be at least 6 characters long'));
    }

    // Verify token
    const resetRecord = await PasswordReset.findValidToken(token);
    if (!resetRecord || !resetRecord.userId) {
      return res.status(400).send(generateErrorHTML('Invalid or expired reset token'));
    }

    // Update user password
    const user = resetRecord.userId;
    user.password = password; // Will be hashed by pre-save middleware
    await user.save();

    // Mark token as used
    await resetRecord.markAsUsed();

    console.log(`🔐 Password reset successful for: ${user.email}`);

    // Show success page
    res.send(generateSuccessHTML(user.name));
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).send(generateErrorHTML('An error occurred while resetting your password'));
  }
};

// Helper function to generate reset form HTML
function generateResetFormHTML(token, userName, userEmail) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - VP Engenharia</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #1a2a33;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: #232b3a;
          padding: 40px;
          border-radius: 12px;
          max-width: 400px;
          width: 100%;
          border: 1px solid #374151;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 28px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #e5e7eb;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #374151;
          border-radius: 8px;
          background-color: #1f2937;
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn {
          width: 100%;
          background-color: #3b82f6;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #2563eb;
        }
        .btn:disabled {
          background-color: #6b7280;
          cursor: not-allowed;
        }
        .user-info {
          background-color: #1f2937;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #3b82f6;
        }
        .requirements {
          font-size: 14px;
          color: #9ca3af;
          margin-top: 5px;
        }
        .error {
          color: #ef4444;
          font-size: 14px;
          margin-top: 5px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>VP Engenharia</h1>
        </div>
        
        <h2 style="text-align: center; margin-bottom: 30px;">Reset Your Password</h2>
        
        <div class="user-info">
          <strong>Account:</strong> ${userName}<br>
          <strong>Email:</strong> ${userEmail}
        </div>
        
        <form id="resetForm" action="/reset-password" method="POST">
          <input type="hidden" name="token" value="${token}">
          
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" required minlength="6">
            <div class="requirements">Must be at least 6 characters long</div>
            <div class="error" id="passwordError"></div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
            <div class="error" id="confirmError"></div>
          </div>
          
          <button type="submit" class="btn" id="submitBtn">Reset Password</button>
        </form>
      </div>
      
      <script>
        const form = document.getElementById('resetForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const submitBtn = document.getElementById('submitBtn');
        
        function validateForm() {
          const passwordError = document.getElementById('passwordError');
          const confirmError = document.getElementById('confirmError');
          
          // Reset errors
          passwordError.style.display = 'none';
          confirmError.style.display = 'none';
          
          let isValid = true;
          
          // Validate password length
          if (password.value.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters long';
            passwordError.style.display = 'block';
            isValid = false;
          }
          
          // Validate password match
          if (password.value !== confirmPassword.value) {
            confirmError.textContent = 'Passwords do not match';
            confirmError.style.display = 'block';
            isValid = false;
          }
          
          submitBtn.disabled = !isValid;
          return isValid;
        }
        
        password.addEventListener('input', validateForm);
        confirmPassword.addEventListener('input', validateForm);
        
        form.addEventListener('submit', function(e) {
          if (!validateForm()) {
            e.preventDefault();
          } else {
            submitBtn.textContent = 'Resetting...';
            submitBtn.disabled = true;
          }
        });
      </script>
    </body>
    </html>
  `;
}

// Helper function to generate error HTML
function generateErrorHTML(errorMessage) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error - VP Engenharia</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #1a2a33;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #232b3a;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          border: 1px solid #374151;
        }
        .error {
          color: #ef4444;
        }
        .btn {
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="error">Error</h1>
        <p>${errorMessage}</p>
        <a href="javascript:history.back()" class="btn">Go Back</a>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate success HTML
function generateSuccessHTML(userName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Password Reset Successful - VP Engenharia</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #1a2a33;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
        }
        .container {
          background-color: #232b3a;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
          border: 1px solid #374151;
        }
        .success {
          color: #10b981;
        }
        .btn {
          background-color: #3b82f6;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
          margin-top: 20px;
        }
        .checkmark {
          font-size: 48px;
          color: #10b981;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="checkmark">✓</div>
        <h1 class="success">Password Reset Successful</h1>
        <p>Hello ${userName},</p>
        <p>Your password has been successfully reset. You can now log in with your new password.</p>
        <a href="/login" class="btn">Go to Login</a>
      </div>
    </body>
    </html>
  `;
} 