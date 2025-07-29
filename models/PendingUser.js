const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: {
      values: ['admin', 'manager', 'financial', 'engineering', 'hr', 'commercial', 'purchasing'],
      message: 'Role must be one of: admin, manager, financial, engineering, hr, commercial, purchasing'
    }
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Note: Password is stored as plain text in pending users
// It will be hashed when the user account is actually created after approval

// Indexes for better performance
pendingUserSchema.index({ email: 1 });
pendingUserSchema.index({ status: 1 });
pendingUserSchema.index({ requestedAt: -1 });

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

module.exports = PendingUser; 