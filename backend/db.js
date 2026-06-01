const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  // If DATABASE_URL exists, use it. Otherwise, use your individual settings.
  connectionString: process.env.DATABASE_URL || undefined, 
  
  // These are only used if DATABASE_URL is NOT provided
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  
  // Required for production connection to Supabase
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;