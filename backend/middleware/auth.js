const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasPermission, ROLES } = require('../config/roles');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. Please login.',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysupersecretkey123@erp');

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.',
            });
        }

        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.',
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token is invalid or expired.',
        });
    }
};

// Role-Based Access Control (RBAC) - check if user has one of the allowed roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login first.',
            });
        }

        // Super admin always has access
        if (req.user.role === ROLES.SUPER_ADMIN) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
            });
        }

        next();
    };
};

// Module-level permission check - checks role + module + action
const checkPermission = (module, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login first.',
            });
        }

        if (!hasPermission(req.user.role, module, action)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. You do not have '${action}' permission for '${module}'.`,
            });
        }

        next();
    };
};

// Optional auth - attach user if token present, but don't require it
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Token invalid, continue without user
        }
    }

    next();
};

module.exports = { protect, authorize, checkPermission, optionalAuth };
