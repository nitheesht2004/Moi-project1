const Entry = require('../models/entry.model');
const db = require('../database/connection');

exports.getAllEntries = async (userId, eventId, filters) => {
    return await Entry.findAll(userId, eventId, filters);
};

exports.getEntryById = async (id, userId) => {
    const entry = await Entry.findById(id, userId);
    if (!entry) {
        throw new Error('Entry not found');
    }
    return entry;
};

exports.createEntry = async (userId, eventId, data) => {
    console.log('🔍 Validating event ownership...');
    console.log('  userId:', userId);
    console.log('  eventId:', eventId);

    // Step 1: Check if event exists (without user filter)
    const eventExistsQuery = await db.query(
        'SELECT * FROM events WHERE id = $1',
        [eventId]
    );

    // Step 2: If event doesn't exist, return 404
    if (eventExistsQuery.rows.length === 0) {
        console.error('❌ Event not found');
        const error = new Error('Event not found');
        error.statusCode = 404;
        throw error;
    }

    const event = eventExistsQuery.rows[0];
    console.log('  event.user_id:', event.user_id);

    // Step 3: If event exists but doesn't belong to user, return 403
    if (event.user_id !== userId) {
        console.error('❌ Unauthorized access to event');
        const error = new Error('Unauthorized access to this event');
        error.statusCode = 403;
        throw error;
    }

    console.log('✅ Event ownership validated');

    const entryData = {
        ...data,
        user_id: userId,
        event_id: eventId
    };
    return await Entry.create(entryData);
};

exports.updateEntry = async (id, userId, data) => {
    console.log('🔍 Validating entry ownership for update...');
    console.log('  entryId:', id);
    console.log('  userId:', userId);

    // Verify entry exists and belongs to user
    const entry = await Entry.findById(id, userId);
    if (!entry) {
        console.error('❌ Entry not found or unauthorized');
        const error = new Error('Entry not found or unauthorized');
        error.statusCode = 403;
        throw error;
    }

    console.log('✅ Entry ownership validated');
    return await Entry.update(id, userId, data);
};

exports.deleteEntry = async (id, userId) => {
    console.log('🔍 Validating entry ownership for deletion...');
    console.log('  entryId:', id);
    console.log('  userId:', userId);

    // Verify entry exists and belongs to user
    const entry = await Entry.findById(id, userId);
    if (!entry) {
        console.error('❌ Entry not found or unauthorized');
        const error = new Error('Entry not found or unauthorized');
        error.statusCode = 403;
        throw error;
    }

    console.log('✅ Entry ownership validated');
    return await Entry.delete(id, userId);
};
