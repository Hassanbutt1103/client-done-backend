const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Allowed Origins for CORS
const allowedOrigins = [
  // 'https://client-done-iota.vercel.app',
  // 'https://client-done-git-main-web-developments-projects-e4ee688f.vercel.app',
  // 'https://client-done-ce3nr3iy5-web-developments-projects-e4ee688f.vercel.app',
  'https://client-done-snowy.vercel.app'
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman/mobile apps
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`🚫 CORS blocked origin: ${origin}`);
    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pending-users', require('./routes/pendingUserRoutes'));
app.use('/api/v1/auth', require('./routes/passwordResetRoutes'));
app.use('/api/v1/client-data', require('./routes/clientDataRoutes'));

// Password Reset SSR routes
const { showResetForm, resetPassword } = require('./controllers/passwordResetController');
app.get('/reset-password', showResetForm);
app.post('/reset-password', resetPassword);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'VP Engenharia API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    database: {
      connected: require('mongoose').connection.readyState === 1,
      name: require('mongoose').connection.name || 'Not connected'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Server Start
app.listen(PORT, () => {
  console.log(`🚀 VP Engenharia Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(`🗄️  Database URI: ${process.env.MONGODB_URI ? 'Configured ✅' : 'Not configured ❌'}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});
