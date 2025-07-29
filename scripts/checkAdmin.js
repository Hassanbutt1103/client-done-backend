const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const checkAdmin = async () => {
  try {
    await connectDB();
    
    // Find admin user
    const admin = await User.findOne({ email: '1103butt@gmail.com' });
    
    if (admin) {
      console.log('✅ Admin user found!');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.name}`);
      console.log(`🔑 Role: ${admin.role}`);
      console.log(`📊 Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
      console.log(`📅 Created: ${admin.createdAt}`);
      console.log(`🔓 Last Login: ${admin.lastLogin || 'Never'}`);
      
      if (admin.role === 'admin' && admin.isActive) {
        console.log('\n🎉 FORGOT PASSWORD READY!');
        console.log('This admin can use the forgot password feature.');
      } else {
        console.log('\n⚠️  POTENTIAL ISSUES:');
        if (admin.role !== 'admin') {
          console.log(`❌ Role is "${admin.role}" but should be "admin"`);
        }
        if (!admin.isActive) {
          console.log('❌ Account is inactive');
        }
      }
    } else {
      console.log('❌ Admin user with email 1103butt@gmail.com not found');
      console.log('Run: npm run create-admins');
    }
    
    console.log('\n🧪 Test Instructions:');
    console.log('1. Go to: http://localhost:5174');
    console.log('2. Click: "Esqueceu sua senha?"');
    console.log('3. Enter: 1103butt@gmail.com');
    console.log('4. Check server console for email preview URL');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin:', error);
    process.exit(1);
  }
};

checkAdmin(); 