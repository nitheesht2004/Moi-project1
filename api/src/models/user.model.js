const db = require('../database/connection');

class User {
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await db.query(query, [username]);
        return result.rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    static async create(userData) {
        const { username, password, role, email, fullName } = userData;
        const query = `
      INSERT INTO users (username, password, role, email, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, created_at
    `;
        const result = await db.query(query, [username, password, role || 'user', email, fullName]);
        return result.rows[0];
    }
}

module.exports = User;
