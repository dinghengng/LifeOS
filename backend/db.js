const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined, 
  
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,

  // Automatically enables SSL for cloud databases, but turns it off for local testing
  ssl: process.env.DATABASE_URL 
    ? { rejectUnauthorized: false } 
    : false
});

module.exports = pool;