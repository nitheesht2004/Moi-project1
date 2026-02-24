const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
    try {
        console.log('📥 Login request received');
        console.log('  Body:', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            console.error('❌ Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await authService.login(username, password);
        console.log('✅ Login successful for user:', username);
        res.json(result);
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        next(error);
    }
};

exports.register = async (req, res, next) => {
    try {
        console.log('📥 Registration request received');
        console.log('  Body:', req.body);

        const { fullName, email, username, password } = req.body;

        if (!fullName || !email || !username || !password) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const result = await authService.register(fullName, email, username, password);
        console.log('✅ Registration successful for user:', username);
        res.status(201).json(result);
    } catch (error) {
        console.error('❌ Registration failed:', error.message);

        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                error: 'Username already exists'
            });
        }

        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            });
        }

        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        // Implement logout logic
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
