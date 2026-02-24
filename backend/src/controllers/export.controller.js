const exportService = require('../services/export.service');

exports.exportToExcel = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { eventId, name, location, minAmount, maxAmount, sortBy, sortOrder } = req.query;

        if (!eventId) {
            return res.status(400).json({ error: 'eventId is required' });
        }

        // Prepare filters
        const filters = { name, location, minAmount, maxAmount, sortBy, sortOrder };

        // Generate Excel file with user-specific data
        const buffer = await exportService.exportToExcel(userId, eventId, filters);

        // Create user-specific filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `user_${userId}_event_${eventId}_${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};
