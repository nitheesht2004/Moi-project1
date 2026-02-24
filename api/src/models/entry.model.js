const db = require('../database/connection');

class Entry {
    static async findAll(userId, eventId, filters = {}) {
        let query = `
            SELECT * FROM entries 
            WHERE user_id = $1 AND event_id = $2
        `;
        const params = [userId, eventId];
        let paramIndex = 3;

        // Server-side filtering with ILIKE for case-insensitive search
        if (filters.name) {
            params.push(`%${filters.name}%`);
            query += ` AND name ILIKE $${paramIndex}`;
            paramIndex++;
        }

        if (filters.location) {
            params.push(`%${filters.location}%`);
            query += ` AND location ILIKE $${paramIndex}`;
            paramIndex++;
        }

        if (filters.minAmount) {
            params.push(parseFloat(filters.minAmount));
            query += ` AND amount >= $${paramIndex}`;
            paramIndex++;
        }

        if (filters.maxAmount) {
            params.push(parseFloat(filters.maxAmount));
            query += ` AND amount <= $${paramIndex}`;
            paramIndex++;
        }

        // Dynamic sorting with SQL injection protection
        const allowedSortFields = ['amount', 'name', 'location', 'date'];
        const sortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'date';
        const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortBy} ${sortOrder}, id DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    static async findById(id, userId) {
        const query = 'SELECT * FROM entries WHERE id = $1 AND user_id = $2';
        const result = await db.query(query, [id, userId]);
        return result.rows[0];
    }

    static async create(data) {
        try {
            console.log('🔵 Entry.create called with data:', data);

            const query = `
                INSERT INTO entries (event_id, user_id, name, location, amount, denominations, notes, date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            // Convert amount to number if it's a string
            const amountValue = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;

            const params = [
                data.event_id,
                data.user_id,
                data.name,
                data.location,
                amountValue, // Ensure it's a number
                data.denominations ? JSON.stringify(data.denominations) : null,
                data.notes || null,
                data.date || new Date()
            ];

            console.log('🔵 Executing query with params:', params);

            const result = await db.query(query, params);
            console.log('✅ Entry created in DB:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Database error in Entry.create:', error);
            console.error('Error code:', error.code);
            console.error('Error detail:', error.detail);
            throw error;
        }
    }

    static async update(id, userId, data) {
        const query = `
            UPDATE entries
            SET name = $1, location = $2, amount = $3, denominations = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND user_id = $7
            RETURNING *
        `;
        const result = await db.query(query, [
            data.name,
            data.location,
            data.amount,
            data.denominations ? JSON.stringify(data.denominations) : null,
            data.notes || null,
            id,
            userId
        ]);
        return result.rows[0];
    }

    static async delete(id, userId) {
        const query = 'DELETE FROM entries WHERE id = $1 AND user_id = $2';
        await db.query(query, [id, userId]);
    }
}

module.exports = Entry;
