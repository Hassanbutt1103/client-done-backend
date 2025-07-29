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

// Define the admin users you want to create
const adminUsers = [
  {
    name: 'Admin Principal',
    email: '1103butt@gmail.com',
    password: 'admin123456',
    role: 'admin',
    department: 'Administração',
    position: 'Administrador Principal'
  },
  {
    name: 'Admin Secundário',
    email: 'admin2@vpengenharia.com',
    password: 'admin123456',
    role: 'admin',
    department: 'Administração',
    position: 'Administrador Secundário'
  }
];

const createAdminUsers = async () => {
  try {
    await connectDB();
    
    console.log('🔧 Creating admin users...\n');
    
    for (const adminData of adminUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${adminData.email} already exists - Skipping`);
        continue;
      }
      
      // Create new admin user
      const newAdmin = await User.create(adminData);
      
      console.log(`✅ Admin created successfully!`);
      console.log(`   📧 Email: ${newAdmin.email}`);
      console.log(`   👤 Name: ${newAdmin.name}`);
      console.log(`   🔑 Role: ${newAdmin.role}`);
      console.log(`   🏢 Department: ${newAdmin.department}`);
      console.log(`   💼 Position: ${newAdmin.position}`);
      console.log(`   🔒 Password: ${adminData.password} (CHANGE AFTER FIRST LOGIN)`);
      console.log('');
    }
    
    console.log('🎉 Admin user creation complete!');
    console.log('\n📋 Summary:');
    console.log(`   Created: ${adminUsers.filter(async admin => !(await User.findOne({ email: admin.email }))).length} new admin(s)`);
    console.log(`   Skipped: ${adminUsers.filter(async admin => await User.findOne({ email: admin.email })).length} existing admin(s)`);
    
    console.log('\n🔐 Login Information:');
    adminUsers.forEach(admin => {
      console.log(`   ${admin.name}: ${admin.email} / ${admin.password}`);
    });
    
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('   - Change default passwords after first login');
    console.log('   - Enable 2FA if available');
    console.log('   - Review admin permissions regularly');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  }
};

// If you want to add more admins, just modify the adminUsers array above
// and run: npm run create-admins

createAdminUsers(); 