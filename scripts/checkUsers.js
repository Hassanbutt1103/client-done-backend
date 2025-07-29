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

// Check existing users
const checkUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    // Get all users
    const users = await User.find({}).select('-password');
    
    console.log(`\n📊 Total users in database: ${users.length}`);
    console.log('='.repeat(60));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Run: node scripts/seedUsers.js to create test users');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   🏢 Department: ${user.department || 'Not specified'}`);
        console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check for specific user
    const specificUser = await User.findOne({ email: '2@gmail.com' });
    if (specificUser) {
      console.log('✅ User 2@gmail.com found:');
      console.log(`   Name: ${specificUser.name}`);
      console.log(`   Role: ${specificUser.role}`);
      console.log(`   Active: ${specificUser.isActive}`);
    } else {
      console.log('❌ User 2@gmail.com not found');
      console.log('💡 Run: node scripts/addUser.js to create this user');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking users:', error);
    process.exit(1);
  }
};

// Run the script
checkUsers(); 