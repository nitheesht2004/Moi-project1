const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

exports.login = async (username, password) => {
    console.log('🔐 Login attempt for username:', username);

    const user = await User.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        console.error('❌ Invalid credentials');
        throw new Error('Invalid credentials');
    }

    console.log('✅ User authenticated:', user.username);

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role }, // ✅ Changed id to userId
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ JWT token generated');
    console.log('🔐 Token payload:', { userId: user.id, username: user.username, role: user.role });

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    };
};

exports.register = async (fullName, email, username, password) => {
    console.log('📝 Registration attempt for username:', username);

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
        console.error('❌ Username already exists');
        throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
        console.error('❌ Email already exists');
        throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Create user
    const newUser = await User.create({
        fullName,
        email,
        username,
        password: hashedPassword,
        role: 'user'
    });

    console.log('✅ User created successfully:', newUser.username);

    return {
        success: true,
        message: 'Account created successfully',
        user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.full_name
        }
    };
};

exports.refreshToken = async (refreshToken) => {
    // Implement refresh token logic
    throw new Error('Not implemented');
};
