const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');

const generateToken = (payload) => {
  return jwt.sign({ userId: payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });
};

// @desc    Signup
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    accountType: req.body.accountType || 'buyer',
    role: req.body.role || 'user',
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({ data: user, token });
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  // Generate token
  const token = generateToken(user._id);
  
  res.status(200).json({ data: user, token });
});

// @desc   Make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(
      new ApiError('You are not logged in, Please login to get access', 401)
    );
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ApiError('Invalid or expired token, please login again', 401));
  }

  // 3) Check if user exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError('The user that belongs to this token no longer exists', 401)
    );
  }

  // Store user context in request for the next middleware
  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You are not allowed to access this route', 403)
      );
    }
    next();
  });

// @desc    Forgot password - Send reset code via email
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with that email: ${req.body.email}`, 404));
  }

  // 2) Generate random 6-digit reset code and hash it
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  // 3) Save hashed reset code in DB
  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.passwordResetVerified = false;
  await user.save();

  // 4) Send the reset code via email
  const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                color: #334155;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }
            .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: #0f172a;
                padding: 40px 20px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
                letter-spacing: 1px;
                font-weight: 800;
            }
            .content {
                padding: 48px 40px;
                text-align: center;
            }
            .content h2 {
                margin-top: 0;
                color: #0f172a;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 16px;
            }
            .content p {
                line-height: 1.7;
                color: #64748b;
                font-size: 16px;
                margin-bottom: 24px;
            }
            .otp-container {
                margin: 32px 0;
                padding: 24px;
                background-color: #f1f5f9;
                border-radius: 20px;
                display: inline-block;
                border: 2px dashed #cbd5e1;
            }
            .otp-code {
                font-size: 42px;
                font-weight: 800;
                letter-spacing: 8px;
                color: #0f172a;
                margin: 0;
                font-family: 'Courier New', Courier, monospace;
            }
            .footer {
                padding: 30px;
                background-color: #f8fafc;
                text-align: center;
                font-size: 14px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
            }
            .footer p {
                margin: 4px 0;
            }
            .highlight {
                color: #0f172a;
                font-weight: 700;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SquareNet</h1>
            </div>
            <div class="content">
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>مرحباً <span class="highlight">${user.name}</span>،</p>
                <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <span class="highlight">SquareNet</span>. يرجى استخدام الرمز التالي لإكمال العملية:</p>
                <div class="otp-container">
                    <p class="otp-code">${resetCode}</p>
                </div>
                <p>هذا الرمز صالح لمدة <span class="highlight">10 دقائق</span> فقط.</p>
                <p style="margin-bottom: 0;">إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SquareNet. جميع الحقوق محفوظة.</p>
                <p>تطبيقك العقاري الأمثل في مصر</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'SquareNet - رمز إعادة تعيين كلمة المرور',
      html: htmlTemplate,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError('There is an error in sending email', 500));
  }

  res.status(200).json({ status: 'success', message: 'Reset code sent to email' });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on hashed reset code
  const hashedResetCode = crypto.createHash('sha256').update(req.body.resetCode).digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Reset code invalid or expired', 400));
  }

  // 2) Mark reset code as verified
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: 'success' });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email }).select('+passwordResetVerified');
  if (!user) {
    return next(new ApiError(`There is no user with email: ${req.body.email}`, 404));
  }

  // 2) Check if reset code is verified
  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }

  // 3) Update password and clear reset fields
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 4) Generate new token
  const token = generateToken(user._id);
  res.status(200).json({ token });
});
