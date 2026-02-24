const db = require('../database/connection');

class Event {
    static async findAllByUser(userId) {
        const query = 'SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    static async findById(id, userId) {
        const query = 'SELECT * FROM events WHERE id = $1 AND user_id = $2';
        const result = await db.query(query, [id, userId]);
        return result.rows[0];
    }

    static async delete(id, userId, client = null) {
        const dbClient = client || db;

        // Verify ownership before deletion
        const event = await this.findById(id, userId);
        if (!event) {
            throw new Error('Event not found or unauthorized');
        }

        // Delete event - CASCADE will handle entries and denominations
        const query = 'DELETE FROM events WHERE id = $1 AND user_id = $2';
        await dbClient.query(query, [id, userId]);

        return event;
    }

    static async create(data) {
        const query = `
            INSERT INTO events (name, user_id, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING *
        `;
        const result = await db.query(query, [data.name, data.user_id]);
        return result.rows[0];
    }
}

module.exports = Event;
