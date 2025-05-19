```javascript
// routes/api/internships.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorizeMiddleware');
const Internship = require('../../models/Internship');
const Application = require('../../models/Application');
const User = require('../../models/User');


// @route   POST api/internships
// @desc    Create an internship
// @access  Private (Employer only)
router.post(
    '/',
    [
        protect,
        authorize('employer'),
        [
            check('title', 'Title is required').not().isEmpty(),
            check('companyName', 'Company name is required').not().isEmpty(), // Could also get from req.user.companyName
            check('category', 'Category is required').not().isEmpty(),
            check('location', 'Location is required').not().isEmpty(),
            check('stipend', 'Stipend information is required').not().isEmpty(),
            check('duration', 'Duration is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('skills', 'Skills are required and should be an array').isArray({ min: 1 }),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, category, location, stipend, duration, description, skills, applicationDeadline } = req.body;
        // Company name can be taken from logged-in employer or from body
        const companyName = req.body.companyName || req.user.companyName;


        try {
            const newInternship = new Internship({
                employer: req.user.id, // from protect middleware
                title,
                companyName,
                category,
                location,
                stipend,
                duration,
                description,
                skills,
                applicationDeadline
            });

            const internship = await newInternship.save();
            res.json(internship);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/internships
// @desc    Get all internships (with optional filters)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, location, keyword, employerId } = req.query;
        let query = {};

        if (category) query.category = category;
        if (location) query.location = { $regex: location, $options: 'i' }; // Case-insensitive search
        if (employerId) query.employer = employerId; // For employer dashboard

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { companyName: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { skills: { $regex: keyword, $options: 'i' } }
            ];
        }

        const internships = await Internship.find(query)
            .populate('employer', ['name', 'email', 'companyName']) // Populate employer details
            .sort({ postedDate: -1 }); // Sort by most recent
        res.json(internships);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/internships/:id
// @desc    Get internship by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id)
                                        .populate('employer', ['name', 'email', 'companyName']);
        if (!internship) {
            return res.status(404).json({ msg: 'Internship not found' });
        }
        res.json(internship);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Internship not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/internships/:id
// @desc    Update an internship
// @access  Private (Employer only, owner of internship)
router.put(
    '/:id',
    [
        protect,
        authorize('employer'),
        [ // Add validation checks similar to POST
            check('title', 'Title is required').optional().not().isEmpty(),
            // ... other fields as optional
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, companyName, category, location, stipend, duration, description, skills, applicationDeadline } = req.body;

        try {
            let internship = await Internship.findById(req.params.id);
            if (!internship) {
                return res.status(404).json({ msg: 'Internship not found' });
            }

            // Check if the logged-in employer is the owner
            if (internship.employer.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized' });
            }

            // Build internship object
            const internshipFields = {};
            if (title) internshipFields.title = title;
            if (companyName) internshipFields.companyName = companyName;
            // ... and so on for all fields
            if (category) internshipFields.category = category;
            if (location) internshipFields.location = location;
            if (stipend) internshipFields.stipend = stipend;
            if (duration) internshipFields.duration = duration;
            if (description) internshipFields.description = description;
            if (skills) internshipFields.skills = skills;
            if (applicationDeadline) internshipFields.applicationDeadline = applicationDeadline;


            internship = await Internship.findByIdAndUpdate(
                req.params.id,
                { $set: internshipFields },
                { new: true } // Return the updated document
            ).populate('employer', ['name', 'email', 'companyName']);

            res.json(internship);
        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Internship not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

// @route   DELETE api/internships/:id
// @desc    Delete an internship
// @access  Private (Employer only, owner of internship)
router.delete('/:id', [protect, authorize('employer')], async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.id);
        if (!internship) {
            return res.status(404).json({ msg: 'Internship not found' });
        }

        // Check if the logged-in employer is the owner
        if (internship.employer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Also delete all applications associated with this internship
        await Application.deleteMany({ internship: req.params.id });

        await internship.deleteOne(); // Mongoose 7+
        // For older Mongoose: await Internship.findByIdAndRemove(req.params.id);

        res.json({ msg: 'Internship removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Internship not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
```