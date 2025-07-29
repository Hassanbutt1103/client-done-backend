const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to database using environment variable
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('❌ MONGODB_URI environment variable is not defined. Please check your .env file.');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample users data
const users = [
  {
    name: 'Administrador',
    email: 'admin@vpengenharia.com',
    password: 'admin123',
    role: 'admin',
    department: 'Administração',
    position: 'Administrador do Sistema'
  },
  {
    name: 'Gerente Silva',
    email: 'gerente@vpengenharia.com',
    password: 'gerente123',
    role: 'manager',
    department: 'Gerência',
    position: 'Gerente Geral'
  },
  {
    name: 'João Financeiro',
    email: 'financeiro@vpengenharia.com',
    password: 'financeiro123',
    role: 'financial',
    department: 'Financeiro',
    position: 'Analista Financeiro'
  },
  {
    name: 'Maria Engenheira',
    email: 'engenharia@vpengenharia.com',
    password: 'engenharia123',
    role: 'engineering',
    department: 'Engenharia',
    position: 'Engenheira Civil'
  },
  {
    name: 'Ana RH',
    email: 'rh@vpengenharia.com',
    password: 'rh123456',
    role: 'hr',
    department: 'Recursos Humanos',
    position: 'Analista de RH'
  },
  {
    name: 'Pedro Comercial',
    email: 'comercial@vpengenharia.com',
    password: 'comercial123',
    role: 'commercial',
    department: 'Comercial',
    position: 'Vendedor'
  },
  {
    name: 'Carlos Compras',
    email: 'compras@vpengenharia.com',
    password: 'compras123',
    role: 'purchasing',
    department: 'Compras',
    position: 'Comprador'
  }
];

// Function to seed users
const seedUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Existing users cleared');

    // Create new users
    for (const userData of users) {
      const user = await User.create(userData);
      console.log(`✅ Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Test Login Credentials:');
    console.log('='.repeat(60));
    
    users.forEach(user => {
      console.log(`🔐 ${user.role.toUpperCase()}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👤 User Type: ${user.role}`);
      console.log('');
    });

    console.log('💡 Environment Variables Used:');
    console.log(`   🗄️  MONGODB_URI: ${process.env.MONGODB_URI ? 'Configured ✅' : 'Not configured ❌'}`);
    console.log(`   🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured ✅' : 'Not configured ❌'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedUsers(); 