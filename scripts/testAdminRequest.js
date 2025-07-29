const mongoose = require('mongoose');
const PendingUser = require('../models/PendingUser');
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

const createTestAdminRequest = async () => {
  try {
    await connectDB();
    
    // Create a test admin registration request
    const testAdminRequest = {
      name: 'Test Admin User',
      email: 'testadmin@vpengenharia.com',
      password: 'testpassword123', // Will be stored as plain text in pending
      role: 'admin',
      department: 'Administração',
      position: 'Teste de Administrador'
    };
    
    // Check if request already exists
    const existingRequest = await PendingUser.findOne({ email: testAdminRequest.email });
    if (existingRequest) {
      console.log('⚠️  Test admin request already exists');
      console.log(`   Status: ${existingRequest.status}`);
      console.log(`   Email: ${existingRequest.email}`);
      console.log(`   Role: ${existingRequest.role}`);
      process.exit(0);
    }
    
    // Create the pending request
    const pendingRequest = await PendingUser.create(testAdminRequest);
    
    console.log('✅ Test admin registration request created!');
    console.log(`   📧 Email: ${pendingRequest.email}`);
    console.log(`   👤 Name: ${pendingRequest.name}`);
    console.log(`   🔑 Role: ${pendingRequest.role}`);
    console.log(`   📊 Status: ${pendingRequest.status}`);
    console.log(`   📅 Requested: ${pendingRequest.requestedAt}`);
    
    console.log('\n🧪 Test Instructions:');
    console.log('1. Login as an existing admin');
    console.log('2. Go to User Management → Pending Requests tab');
    console.log('3. You should see the admin request highlighted in red');
    console.log('4. Click approve to make them an admin');
    console.log('5. The new admin can then login with:');
    console.log(`   Email: ${testAdminRequest.email}`);
    console.log(`   Password: ${testAdminRequest.password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test admin request:', error);
    process.exit(1);
  }
};

createTestAdminRequest(); 