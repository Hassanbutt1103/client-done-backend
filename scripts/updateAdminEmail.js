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

const updateAdminEmail = async () => {
  try {
    await connectDB();
    
    // Find existing admin user
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      // Update existing admin email
      existingAdmin.email = '1103butt@gmail.com';
      existingAdmin.name = 'Admin VP Engenharia';
      await existingAdmin.save();
      
      console.log('✅ Admin email updated successfully!');
      console.log(`📧 New email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`📊 Status: ${existingAdmin.isActive ? 'Active' : 'Inactive'}`);
    } else {
      // Create new admin user if none exists
      const newAdmin = await User.create({
        name: 'Admin VP Engenharia',
        email: '1103butt@gmail.com',
        password: 'admin123456', // Change this password after first login
        role: 'admin',
        department: 'Administração',
        position: 'Administrador do Sistema'
      });
      
      console.log('✅ New admin user created successfully!');
      console.log(`📧 Email: ${newAdmin.email}`);
      console.log(`👤 Name: ${newAdmin.name}`);
      console.log(`🔑 Role: ${newAdmin.role}`);
      console.log(`🔒 Password: admin123456 (CHANGE THIS AFTER FIRST LOGIN)`);
    }
    
    console.log('\n🎉 Admin setup complete! You can now use forgot password with 1103butt@gmail.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
};

updateAdminEmail(); 