# SquareNet Backend 🏢

The robust backend API for **SquareNet**, a modern real estate platform. Built with Node.js, Express, and MongoDB, this API powers property listings, real-time communication, and secure user management.

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based auth with password hashing (Bcrypt), email verification, and password reset via OTP.
- **Property Management**: Complete CRUD for real estate listings with image processing and Cloudinary storage.
- **Real-time Chat**: Interactive messaging system powered by **Socket.io**.
- **Category System**: Organized property categorization with associated imagery.
- **Advanced Search**: Filtering and searching capabilities for properties.
- **Security Suite**: Protected against common web vulnerabilities (XSS, NoSQL Injection, HPP, etc.) using Helmet, Mongo-Sanitize, and HPP.
- **Media Handling**: Image uploading and optimization using Multer and Sharp, integrated with Cloudinary.
- **Notifications**: System-wide notifications for user interactions.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Nodemailer

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Youssef-Mansour854/SquareNet-Backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd back-end
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## ⚙️ Configuration

Create a `config.env` file in the root of the `back-end` directory and add the following environment variables:

```env
PORT=8000
NODE_ENV=development
DB_URL=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE_TIME=90d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email
EMAIL_HOST=your_host
EMAIL_PORT=your_port
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

## 🏃‍♂️ Running the Project

- **Development mode**:
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

## 📂 Seed Data

To populate or clear the database with sample data:

- **Insert sample data**:
  ```bash
  npm run seed:insert
  ```
- **Clear database**:
  ```bash
  npm run seed:destroy
  ```

## 📄 License

This project is licensed under the ISC License.
