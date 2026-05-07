const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config({ path: 'config.env' });

const promote = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to Database...');

    const email = 'yh809840@gmail.com'; // الإيميل الصحيح للـ Super Admin    const user = await User.findOneAndUpdate(
      { email },
      { role: 'superadmin' },
      { new: true }
    );

    if (user) {
      console.log(`Success! User ${email} is now a superadmin.`);
    } else {
      console.log('User not found. Make sure you registered this email first.');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

promote();
