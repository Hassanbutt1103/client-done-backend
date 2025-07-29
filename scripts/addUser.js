const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to database using environment variable
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vp-engenharia';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Add the missing user
const addUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: '2@gmail.com' });
    if (existingUser) {
      console.log('⚠️  User 2@gmail.com already exists');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Active: ${existingUser.isActive}`);
      return;
    }

    // Create new user
    const userData = {
      name: 'Test User',
      email: '2@gmail.com',
      password: 'password123',
      role: 'financial',
      department: 'Financeiro',
      position: 'Analista Financeiro',
      isActive: true
    };

    const user = await User.create(userData);
    console.log(`✅ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);

    console.log('\n📝 Login Credentials:');
    console.log('='.repeat(40));
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Password: ${userData.password}`);
    console.log(`👤 User Type: ${userData.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding user:', error);
    process.exit(1);
  }
};

// Run the script
addUser(); 