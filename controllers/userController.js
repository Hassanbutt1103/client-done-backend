const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { clearUserCache } = require('../middleware/auth');

// Helper function to generate JWT token using environment variables
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });
};

// Helper function to send response with token
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.status(statusCode)
     .cookie('token', token, cookieOptions)
     .json({
       status: 'success',
       message,
       token,
       user: {
         id: user._id,
         name: user.name,
         email: user.email,
         role: user.role,
         department: user.department,
         position: user.position,
         isActive: user.isActive,
         lastLogin: user.lastLogin
       }
     });
};

// @desc    Register a new user (redirect to pending system)
// @route   POST /api/v1/users/register
// @access  Public
exports.register = async (req, res) => {
  // Redirect registration requests to the pending user system
  return res.status(400).json({
    status: 'error',
    message: 'Direct registration is no longer available. Please use the registration request system.',
    redirectTo: '/api/v1/pending-users/request'
  });
};

// @desc    Login user
// @route   POST /api/v1/users/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email, password, and user type'
      });
    }

    // Find user and include password with optimized query
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user type matches user role
    if (userType.toLowerCase() !== user.role.toLowerCase()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to login as this user type'
      });
    }

    // Update last login (non-blocking for better performance)
    user.updateLastLogin().catch(err => {
      console.error('❌ Error updating last login:', err);
    });

    // Clear any cached data for this user
    clearUserCache(user._id);

    console.log(`✅ Login successful: ${user.email} (${user.role})`);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during login process'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      user: user.userInfo
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user profile'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, position } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (department) user.department = department;
    if (position) user.position = position;

    await user.save();

    console.log(`✅ Profile updated: ${user.email}`);
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      user: user.userInfo
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/v1/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed automatically by pre-save middleware)
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed: ${user.email}`);
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error changing password'
    });
  }
};

// @desc    Logout user
// @route   POST /api/v1/users/logout
// @access  Public
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    // Get ALL users (both active and inactive) for admin management
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
};

// @desc    Update user by ID (Admin only)
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find and update the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'email', 'role', 'department', 'position', 'isActive'];
    const updateFields = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateFields, 
      { new: true, runValidators: true }
    ).select('-password');

    console.log(`✅ User updated: ${updatedUser.email} - Status: ${updatedUser.isActive ? 'Active' : 'Inactive'}`);
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user'
    });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/v1/users/create
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, position } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, password, and role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists'
      });
    }

    // Validate role (including admin for admin-created users)
    const validRoles = ['admin', 'manager', 'financial', 'engineering', 'hr', 'commercial', 'purchasing'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role specified'
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      role,
      department: department || '',
      position: position || ''
    });

    console.log(`✅ User created by admin: ${newUser.email} (${newUser.role}) - Created by: ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        position: newUser.position,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Error creating user'
    });
  }
};

// @desc    Delete user by ID (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    // Delete the user from User collection
    await User.findByIdAndDelete(id);

    // Clean up any related PendingUser records with the same email
    // This allows the user to register again if needed
    const PendingUser = require('../models/PendingUser');
    const deletedPendingRecords = await PendingUser.deleteMany({ email: user.email });
    
    console.log(`✅ User deleted: ${user.email}`);
    if (deletedPendingRecords.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedPendingRecords.deletedCount} related pending user record(s)`);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully and related records cleaned up'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
}; 