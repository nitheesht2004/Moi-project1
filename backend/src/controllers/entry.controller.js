const entryService = require('../services/entry.service');

exports.getAllEntries = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { eventId, name, location, minAmount, maxAmount, sortBy, sortOrder } = req.query;

        if (!eventId) {
            return res.status(400).json({ error: 'eventId is required' });
        }

        const filters = { name, location, minAmount, maxAmount, sortBy, sortOrder };
        const entries = await entryService.getAllEntries(userId, eventId, filters);
        res.json(entries);
    } catch (error) {
        next(error);
    }
};

exports.getEntryById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const entry = await entryService.getEntryById(req.params.id, userId);
        res.json(entry);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }
        if (statusCode === 403 || error.message.includes('unauthorized') || error.message.includes('not found')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
};

exports.createEntry = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { eventId, name, location, amount, denominations, notes } = req.body;

        // Log the incoming request for debugging
        console.log('📝 Create Entry Request:', {
            userId,
            eventId,
            name,
            location,
            amount,
            amountType: typeof amount,
            denominations,
            notes
        });

        if (!eventId) {
            console.error('❌ Missing eventId');
            return res.status(400).json({ error: 'eventId is required' });
        }

        if (!name || !location || !amount) {
            console.error('❌ Missing required fields:', { name, location, amount });
            return res.status(400).json({ error: 'name, location, and amount are required' });
        }

        const entry = await entryService.createEntry(userId, eventId, req.body);
        console.log('✅ Entry created successfully:', entry);
        res.status(201).json(entry);
    } catch (error) {
        console.error('❌ Create entry error:', error.message);

        const statusCode = error.statusCode || 500;

        // Handle 404 - Event not found
        if (statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }

        // Handle 403 - Unauthorized access
        if (statusCode === 403) {
            return res.status(403).json({ error: error.message });
        }

        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        next(error);
    }
};

exports.updateEntry = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const entry = await entryService.updateEntry(req.params.id, userId, req.body);
        res.json(entry);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }
        if (statusCode === 403 || error.message.includes('unauthorized') || error.message.includes('not found')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
};

exports.deleteEntry = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        await entryService.deleteEntry(req.params.id, userId);
        res.json({ success: true, message: 'Entry deleted successfully' });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }
        if (statusCode === 403 || error.message.includes('unauthorized') || error.message.includes('not found')) {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
};
