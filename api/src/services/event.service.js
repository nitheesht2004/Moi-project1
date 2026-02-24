const Event = require('../models/event.model');
const db = require('../database/connection');
// No separate Pool — use the shared singleton via db.getClient() for transactions

exports.getAllEvents = async (userId) => {
    return await Event.findAllByUser(userId);
};

exports.getEventById = async (id, userId) => {
    // Check if event exists at all
    const eventExistsQuery = await db.query('SELECT * FROM events WHERE id = $1', [id]);

    if (eventExistsQuery.rows.length === 0) {
        const error = new Error('Event not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if user owns the event
    const event = await Event.findById(id, userId);
    if (!event) {
        const error = new Error('Unauthorized access to this event');
        error.statusCode = 403;
        throw error;
    }

    return event;
};

exports.deleteEvent = async (id, userId) => {
    const client = await db.getClient();

    try {
        // Begin transaction
        await client.query('BEGIN');

        console.log(`🔄 Starting transaction to delete event ${id} for user ${userId}`);

        // Check if event exists at all
        const eventExistsQuery = await db.query('SELECT * FROM events WHERE id = $1', [id]);

        if (eventExistsQuery.rows.length === 0) {
            const error = new Error('Event not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify user owns the event
        const event = await Event.findById(id, userId);
        if (!event) {
            const error = new Error('Unauthorized access to this event');
            error.statusCode = 403;
            throw error;
        }

        // Delete event (CASCADE will handle entries and denominations)
        await Event.delete(id, userId, client);

        // Commit transaction
        await client.query('COMMIT');
        console.log(`✅ Transaction committed - Event ${id} deleted successfully`);

        return {
            success: true,
            message: 'Event and all associated data deleted successfully'
        };
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        console.error(`❌ Transaction rolled back - Error deleting event ${id}:`, error.message);

        return {
            success: false,
            message: error.message || 'Failed to delete event',
            statusCode: error.statusCode || 500
        };
    } finally {
        // Release client back to pool
        client.release();
    }
};

exports.createEvent = async (userId, data) => {
    const eventData = {
        ...data,
        user_id: userId
    };
    return await Event.create(eventData);
};
