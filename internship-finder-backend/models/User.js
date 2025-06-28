// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'employer'],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },

    // --- NEW EMPLOYER FIELDS ---
    companyName: {
        type: String,
        default: '',
    },
    companyWebsite: {
        type: String,
        default: '',
    },
    companyDescription: {
        type: String,
        default: '',
    },

    // --- NEW STUDENT FIELDS ---
    skills: {
        type: [String],
        default: [],
    },
    education: {
        type: String,
        default: '',
    },
    resumeLink: {
        type: String,
        default: '',
    },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password for login
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);