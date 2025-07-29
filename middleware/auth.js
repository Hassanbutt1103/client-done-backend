const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Get JWT secret from environment variables
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        console.error('❌ JWT_SECRET environment variable is not defined');
        return res.status(500).json({
          status: 'error',
          message: 'Server configuration error'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, jwtSecret);
      
      // Find user by id from token in database
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'No user found with this token'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been deactivated'
        });
      }

      // Grant access to protected route
      req.user = user;
      next();
    } catch (error) {
      // Detailed error logging for debugging
      if (error.name === 'JsonWebTokenError') {
        console.error('❌ JWT Error:', error.message, '| Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token format. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else if (error.name === 'TokenExpiredError') {
        console.error('❌ Token expired:', error.message);
        return res.status(401).json({
          status: 'error',
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else {
        console.error('❌ Token verification error:', error.message);
        return res.status(401).json({
          status: 'error',
          message: 'Authentication failed. Please login again.',
          code: 'AUTH_FAILED'
        });
      }
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during authentication'
    });
  }
};

// Middleware to authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Please login to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Middleware to check if user owns resource or is admin
exports.authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Please login to access this route'
    });
  }

  // Allow if user is admin or accessing their own resource
  if (req.user.role === 'admin' || req.user.id === req.params.id) {
    next();
  } else {
    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to access this resource'
    });
  }
}; 