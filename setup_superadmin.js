const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

dotenv.config({ path: 'config.env' });

const setupSuperAdmin = async () => {
  try {
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
      console.error('Error: DB_URI is not defined in config.env');
      process.exit(1);
    }

    await mongoose.connect(dbUri);
    console.log('Successfully connected to MongoDB...');

    const email = 'yh809840@gmail.com';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 12);

    let user = await User.findOne({ email });

    if (user) {
      console.log(`User ${email} already exists. Updating role to 'superadmin' and resetting password...`);
      user.role = 'superadmin';
      user.password = hashedPassword;
      await user.save();
      console.log('User promoted and password updated successfully.');
    } else {
      console.log(`Creating new superadmin user: ${email}...`);
      user = await User.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'superadmin',
        accountType: 'owner',
        active: true
      });
      console.log('Superadmin user created successfully.');
    }

    console.log('\n--------------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password} (Please change this after login)`);
    console.log('Role: superadmin');
    console.log('--------------------------------------------------\n');

    process.exit();
  } catch (err) {
    console.error('An error occurred during superadmin setup:', err.message);
    process.exit(1);
  }
};

setupSuperAdmin();

