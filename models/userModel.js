const mongoose = require ('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'name required'],
    },
    slug: {
        type: String,
        lowercase: true,
    },
    email: {
        type: String,
        required: [true, 'email required'],
        unique: true,
        lowercase: true,
    },
    phone: String,
    profileImg: String,
    password: {
        type: String,
        required: [true, 'password required'],
        minlength: [6, 'too short password'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user',
    },
    accountType: {
        type: String,
        enum: ['buyer', 'owner', 'agent'],
        default: 'buyer',
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio is too long'],
    },
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address is too long'],
    },
    verifiedAgent: {
        type: Boolean,
        default: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
    passwordChangedAt: Date,
    passwordResetCode: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    passwordResetVerified: {
        type: Boolean,
        select: false,
    },
    wishlist: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Property',
        },
    ],
    
}, { timestamps: true })


const User = mongoose.model('User', userSchema)

module.exports = User;