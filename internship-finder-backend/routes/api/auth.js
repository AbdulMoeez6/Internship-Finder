// routes/api/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const { protect } = require('../../middleware/authMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role is required and must be student or employer').isIn(['student', 'employer']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role, companyName } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            user = new User({
                name,
                email,
                password,
                role,
                companyName: role === 'employer' ? companyName : undefined
            });

            await user.save(); // Password will be hashed by pre-save hook

            const payload = { user: { id: user.id, role: user.role } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' }, // Token expires in 5 hours
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: {id: user.id, name: user.name, email: user.email, role: user.role, companyName: user.companyName } });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payload = { user: { id: user.id, role: user.role } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: {id: user.id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }});
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   GET api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        // req.user is set by the 'protect' middleware
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


module.exports = router;