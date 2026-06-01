// var fs = require('fs');
// var mysql = require('mysql2');

// var connection = mysql.createConnection({

//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   host: process.env.DB_HOST,
//   database: process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school',
//   port: process.env.DB_PORT,
//   waitForConnections: true,
//   connectionLimit: 10,  // Max number of connections at a time
//   queueLimit: 0 ,
//   timezone: '+05:30' // Set India Time Zone
// });
// connection.connect(function (err) {
//   if (err) throw err;
//   console.log("Node Server started and Database Connected Successfully");
// });

// module.exports = connection;

// module.exports.secret = 'AVR_developers_working';

const mysql = require('mysql2');

// Create a pool of connections
const pool = mysql.createPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school',
  port: process.env.DB_PORT,
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


