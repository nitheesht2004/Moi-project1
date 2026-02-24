const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('🔐 Auth middleware - Authorization header:', authHeader);

        const token = authHeader?.split(' ')[1];

        if (!token) {
            console.error('❌ No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🔐 Token found, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token verified, user:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
