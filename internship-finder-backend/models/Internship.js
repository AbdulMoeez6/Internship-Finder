// models/Internship.js
const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema({
    employer: { // Reference to the User who posted it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: { type: String, required: true },
    companyName: { type: String, required: true }, // Can be auto-filled from employer's profile
    category: { type: String, required: true },
    location: { type: String, required: true },
    stipend: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    skills: { type: [String], required: true }, // Array of strings
    postedDate: { type: Date, default: Date.now },
    applicationDeadline: { type: Date }, // Optional
    // We'll manage applications in a separate collection
});

module.exports = mongoose.model('Internship', InternshipSchema);