const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadCSV,
  getClientData,
  deleteClientData,
  getAnalytics,
  cleanupDuplicates
} = require('../controllers/clientDataController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (no file system storage)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/csv' || 
      file.originalname.toLowerCase().endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: multer.memoryStorage(), // Use memory storage instead of disk
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getClientData);
router.get('/analytics', getAnalytics);

// Admin and manager routes
router.post('/upload', authorize('admin', 'manager', 'financial'), upload.single('csvFile'), uploadCSV);
router.post('/cleanup-duplicates', authorize('admin'), cleanupDuplicates);
router.delete('/:id', authorize('admin'), deleteClientData);

module.exports = router; 