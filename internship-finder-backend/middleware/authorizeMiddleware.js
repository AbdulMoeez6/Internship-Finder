
// middleware/authorizeMiddleware.js
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) { // Should be set by 'protect' middleware
            return res.status(401).json({ msg: 'Not authorized, no user data' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { authorize };
