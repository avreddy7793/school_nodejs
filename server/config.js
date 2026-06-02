
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'lot.env.local') });
require('dotenv').config();

const mysql = require('mysql2');

function envValue(key, fallback = undefined) {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : fallback;
}

// Create a pool of connections
const pool = mysql.createPool({
  user: envValue('DB_USER'),
  password: envValue('DB_PASSWORD'),
  host: envValue('DB_HOST'),
  database: envValue('DB_SCHOOL_DATABASE') || envValue('DB_DATABASE') || 'school',
  port: envValue('DB_PORT', 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+05:30',
});

// Test the connection when the app starts
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error acquiring database connection:", err.message);
  } else {
    console.log("Database connection successful");
    connection.release(); // Release the connection back to the pool
  }
});

// Export the pool
module.exports = {
  pool,
  secret: 'AVR_developers_working',
};


