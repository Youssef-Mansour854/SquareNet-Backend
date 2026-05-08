const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

dotenv.config({ path: 'config.env' });

const reset = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to Atlas Database...');

    // 1) Delete all users
    await User.deleteMany();
    console.log('All users deleted.');

    // 2) Create fresh superadmin
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'superadmin',
      accountType: 'owner',
      phone: '01111111111'
    });

    console.log('Success! New Super Admin Created.');
    console.log('Email: admin@test.com');
    console.log('Password: password123');
    process.exit();
  } catch (err) {
    console.error('Error during reset:', err);
    process.exit(1);
  }
};

reset();
