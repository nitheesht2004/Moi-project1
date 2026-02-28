const db = require('../database/connection');

class Location {
    static async findAll() {
        const query = 'SELECT * FROM locations ORDER BY name';
        const result = await db.query(query);
        return result.rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM locations WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async create(data) {
        const query = `
      INSERT INTO locations (name)
      VALUES ($1)
      RETURNING *
    `;
        const result = await db.query(query, [data.name]);
        return result.rows[0];
    }
}

module.exports = Location;
