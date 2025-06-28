
// models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studentName: { type: String, required: true }, // Denormalized for easier display
    studentEmail: { type: String, required: true },// Denormalized for easier display
    status: {
        type: String,
        enum: ['Applied', 'Viewed by Employer', 'Shortlisted', 'Rejected', 'Hired'],
        default: 'Applied',
    },
    appliedDate: {
        type: Date,
        default: Date.now,
    },
    // You could add fields for cover letter, resume link, etc.
});

module.exports = mongoose.model('Application', ApplicationSchema);
