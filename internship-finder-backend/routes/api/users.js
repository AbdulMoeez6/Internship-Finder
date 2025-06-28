// internship-finder-backend/routes/api/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const User = require('../../models/User');

// @route   GET api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/profile
// @desc    Update user's profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    // Destructure all possible fields from the request body
    const {
        name,
        companyWebsite,
        companyDescription,
        skills,
        education,
        resumeLink
    } = req.body;

    // Build profile object with only the fields that were sent
    const profileFields = {};
    if (name) profileFields.name = name;

    // Employer-specific fields
    if (companyWebsite !== undefined) profileFields.companyWebsite = companyWebsite;
    if (companyDescription !== undefined) profileFields.companyDescription = companyDescription;

    // Student-specific fields
    if (skills) profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    if (education !== undefined) profileFields.education = education;
    if (resumeLink !== undefined) profileFields.resumeLink = resumeLink;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true } // Return the updated document
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;