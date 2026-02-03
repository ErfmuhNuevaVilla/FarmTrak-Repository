const { Pool } = require("pg");
const { env } = require("../config/env");

// Uses DATABASE_URL, e.g.:
// postgres://user:pass@localhost:5432/farmtrak
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

module.exports = { pool };

