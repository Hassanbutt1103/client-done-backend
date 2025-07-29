const express = require('express');
const {
  submitRegistrationRequest,
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  deleteRequest,
  cleanupOldRequests
} = require('../controllers/pendingUserController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/request', submitRegistrationRequest);

// Admin only routes
router.use(protect); // Protect all routes below this
router.use(authorize('admin')); // Only allow admin access

router.get('/', getPendingRequests);
router.get('/all', getAllRequests);
router.put('/:id/approve', approveRequest);
router.put('/:id/reject', rejectRequest);
router.delete('/cleanup', cleanupOldRequests);
router.delete('/:id', deleteRequest);

module.exports = router; 