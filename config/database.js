const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable for MongoDB URI
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Optimized connection options for production (removed unsupported options)
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pooling for better performance
      maxPoolSize: 10,
      minPoolSize: 2,
      // Connection timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Read preference for better performance
      readPreference: 'primaryPreferred',
      // Write concern for better reliability
      w: 'majority',
      j: true
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`⚡ Pool Size: ${conn.connection.pool ? conn.connection.pool.size : 'N/A'}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('💡 Make sure MONGODB_URI is set in your .env file');
    process.exit(1);
  }
};

// Handle MongoDB events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database disconnection:', error);
    process.exit(1);
  }
});

module.exports = connectDB; 