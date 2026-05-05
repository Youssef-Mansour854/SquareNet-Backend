const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Property = require('../../models/PropertyModel');
const Category = require('../../models/CategoryModel');
const User = require('../../models/userModel');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../config.env') });

// Connect to DB
mongoose.connect(process.env.DB_URI || process.env.DB_URI_LOCAL)
  .then(() => console.log('DB Connection Successful for Seeding!'))
  .catch((err) => {
      console.log('DB Connection Error: ', err.message);
      process.exit(1);
  });

// Read dummy data
const properties = JSON.parse(fs.readFileSync(`${__dirname}/properties.json`, 'utf-8'));
const categories = JSON.parse(fs.readFileSync(`${__dirname}/categories.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// Insert data into DB
const insertData = async () => {
  try {
    await Category.create(categories);
    await Property.create(properties);
    await User.create(users);
    console.log('Data Inserted successfully! 🌱');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await Property.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log('Data Destroyed successfully! 🗑️');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  insertData();
} else if (process.argv[2] === '-d') {
  destroyData();
} else {
    console.log('Please pass -i to insert or -d to destroy data. Example: node seeder.js -i');
    process.exit();
}
