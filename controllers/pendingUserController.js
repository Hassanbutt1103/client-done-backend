const PendingUser = require('../models/PendingUser');
const User = require('../models/User');

// @desc    Submit registration request
// @route   POST /api/v1/pending-users/request
// @access  Public
exports.submitRegistrationRequest = async (req, res) => {
  try {
    const { name, email, password, role, department, position } = req.body;

    // Check if user already exists (in both User and PendingUser collections)
    const existingUser = await User.findOne({ email });
    const existingPendingUser = await PendingUser.findOne({ email, status: 'pending' });
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists. If this account was previously deleted, please contact the administrator.'
      });
    }

    if (existingPendingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'A registration request with this email is already pending approval'
      });
    }

    // Clean up any old processed pending records for this email (approved/rejected)
    // This ensures clean re-registration after account deletion
    await PendingUser.deleteMany({ 
      email, 
      status: { $in: ['approved', 'rejected'] } 
    });

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, password, and role'
      });
    }

    // Allow all roles including admin to be requested
    // Admin requests will go through the same approval process

    // Create pending user request
    const pendingUser = await PendingUser.create({
      name,
      email,
      password,
      role,
      department: department || '',
      position: position || ''
    });

    console.log(`📋 New registration request submitted: ${pendingUser.email} (${pendingUser.role})`);
    
    res.status(201).json({
      status: 'success',
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: pendingUser._id,
        email: pendingUser.email,
        status: pendingUser.status
      }
    });
  } catch (error) {
    console.error('❌ Registration request error:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error submitting registration request'
    });
  }
};

// @desc    Get all pending registration requests
// @route   GET /api/v1/pending-users
// @access  Private (Admin only)
exports.getPendingRequests = async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ status: 'pending' })
      .sort({ requestedAt: -1 })
      .select('-password');

    res.status(200).json({
      status: 'success',
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching pending registration requests'
    });
  }
};

// @desc    Get all registration requests (including approved/rejected)
// @route   GET /api/v1/pending-users/all
// @access  Private (Admin only)
exports.getAllRequests = async (req, res) => {
  try {
    const allRequests = await PendingUser.find({})
      .populate('reviewedBy', 'name email')
      .sort({ requestedAt: -1 })
      .select('-password');

    res.status(200).json({
      status: 'success',
      count: allRequests.length,
      data: allRequests
    });
  } catch (error) {
    console.error('❌ Error fetching all requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching registration requests'
    });
  }
};

// @desc    Approve registration request
// @route   PUT /api/v1/pending-users/:id/approve
// @access  Private (Admin only)
exports.approveRequest = async (req, res) => {
  try {
    const pendingUser = await PendingUser.findById(req.params.id);

    if (!pendingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration request not found'
      });
    }

    if (pendingUser.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Registration request has already been processed'
      });
    }

    // Check if email is still available (in case someone registered with same email)
    const existingUser = await User.findOne({ email: pendingUser.email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists'
      });
    }

    // Create the actual user (password will be hashed by User model middleware)
    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Plain text - will be hashed by User model
      role: pendingUser.role,
      department: pendingUser.department,
      position: pendingUser.position
    });

    // Update pending request status
    pendingUser.status = 'approved';
    pendingUser.reviewedAt = new Date();
    pendingUser.reviewedBy = req.user.id;
    await pendingUser.save();

    console.log(`✅ Registration approved: ${newUser.email} by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Registration request approved successfully',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('❌ Error approving request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error approving registration request'
    });
  }
};

// @desc    Reject registration request
// @route   PUT /api/v1/pending-users/:id/reject
// @access  Private (Admin only)
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const pendingUser = await PendingUser.findById(req.params.id);

    if (!pendingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration request not found'
      });
    }

    if (pendingUser.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Registration request has already been processed'
      });
    }

    // Update pending request status
    pendingUser.status = 'rejected';
    pendingUser.reviewedAt = new Date();
    pendingUser.reviewedBy = req.user.id;
    pendingUser.rejectionReason = reason || 'No reason provided';
    await pendingUser.save();

    console.log(`❌ Registration rejected: ${pendingUser.email} by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Registration request rejected successfully'
    });
  } catch (error) {
    console.error('❌ Error rejecting request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rejecting registration request'
    });
  }
};

// @desc    Delete registration request
// @route   DELETE /api/v1/pending-users/:id
// @access  Private (Admin only)
exports.deleteRequest = async (req, res) => {
  try {
    const pendingUser = await PendingUser.findByIdAndDelete(req.params.id);

    if (!pendingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration request not found'
      });
    }

    console.log(`🗑️  Registration request deleted: ${pendingUser.email} by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Registration request deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting registration request'
    });
  }
};

// @desc    Clean up old processed pending requests (approved/rejected)
// @route   DELETE /api/v1/pending-users/cleanup
// @access  Private (Admin only)
exports.cleanupOldRequests = async (req, res) => {
  try {
    // Delete all approved and rejected requests older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await PendingUser.deleteMany({
      status: { $in: ['approved', 'rejected'] },
      reviewedAt: { $lt: thirtyDaysAgo }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old processed requests by ${req.user.email}`);

    res.status(200).json({
      status: 'success',
      message: `Successfully cleaned up ${result.deletedCount} old processed requests`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error cleaning up old requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cleaning up old requests'
    });
  }
}; 