const eventService = require('../services/event.service');

exports.getAllEvents = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const events = await eventService.getAllEvents(userId);
        res.json(events);
    } catch (error) {
        next(error);
    }
};

exports.getEventById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const event = await eventService.getEventById(req.params.id, userId);
        res.json(event);
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode === 404) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (statusCode === 403) {
            return res.status(403).json({ error: 'Unauthorized access to this event' });
        }
        next(error);
    }
};

exports.createEvent = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const event = await eventService.createEvent(userId, req.body);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

exports.deleteEvent = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await eventService.deleteEvent(req.params.id, userId);

        if (result.success) {
            res.json(result);
        } else {
            // Failed deletion - check error type
            const statusCode = result.statusCode || 500;
            if (statusCode === 404) {
                return res.status(404).json({ error: 'Event not found' });
            }
            if (statusCode === 403) {
                return res.status(403).json({ error: 'Unauthorized access to this event' });
            }
            res.status(400).json({ error: result.message });
        }
    } catch (error) {
        next(error);
    }
};
