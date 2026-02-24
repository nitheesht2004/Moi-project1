const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('❌ Validation failed:');
        console.error('  Request body:', req.body);
        console.error('  Validation errors:', errors.array());

        return res.status(400).json({
            error: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

exports.validateLogin = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

exports.validateEntry = [
    body('name').notEmpty().withMessage('Name is required'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('denominations').optional().isObject().withMessage('Denominations must be an object'),
    handleValidationErrors
];
