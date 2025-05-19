```javascript
// routes/api/applications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { authorize } = require('../../middleware/authorizeMiddleware');
const Application = require('../../models/Application');
const Internship = require('../../models/Internship');

// @route   POST api/applications/internship/:internshipId
// @desc    Apply for an internship
// @access  Private (Student only)
router.post('/internship/:internshipId', [protect, authorize('student')], async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.internshipId);
        if (!internship) {
            return res.status(404).json({ msg: 'Internship not found' });
        }

        // Check if student already applied
        const existingApplication = await Application.findOne({
            internship: req.params.internshipId,
            student: req.user.id,
        });

        if (existingApplication) {
            return res.status(400).json({ msg: 'You have already applied for this internship' });
        }

        const newApplication = new Application({
            internship: req.params.internshipId,
            student: req.user.id,
            studentName: req.user.name, // From protect middleware
            studentEmail: req.user.email, // From protect middleware
            // Add other application fields from req.body if needed (e.g., cover letter)
        });

        const application = await newApplication.save();
        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/applications/student/my
// @desc    Get all applications for the logged-in student
// @access  Private (Student only)
router.get('/student/my', [protect, authorize('student')], async (req, res) => {
    try {
        const applications = await Application.find({ student: req.user.id })
            .populate('internship', ['title', 'companyName', 'location']) // Populate internship details
            .sort({ appliedDate: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/applications/internship/:internshipId/employer
// @desc    Get all applications for a specific internship (for employer)
// @access  Private (Employer only, owner of internship)
router.get('/internship/:internshipId/employer', [protect, authorize('employer')], async (req, res) => {
    try {
        const internship = await Internship.findById(req.params.internshipId);
        if (!internship) {
            return res.status(404).json({ msg: 'Internship not found' });
        }

        // Check if the logged-in employer is the owner of the internship
        if (internship.employer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to view these applications' });
        }

        const applications = await Application.find({ internship: req.params.internshipId })
            .populate('student', ['name', 'email']) // Populate student details
            .sort({ appliedDate: -1 });
        res.json(applications);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/applications/:applicationId/status
// @desc    Update application status (by employer)
// @access  Private (Employer only, owner of related internship)
router.put('/:applicationId/status', [protect, authorize('employer')], async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Viewed by Employer', 'Shortlisted', 'Rejected', 'Hired'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status provided' });
    }

    try {
        const application = await Application.findById(req.params.applicationId).populate('internship');
        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        // Check if the logged-in employer owns the internship linked to this application
        if (application.internship.employer.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this application' });
        }

        application.status = status;
        await application.save();
        res.json(application);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
```