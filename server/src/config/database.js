const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});

const useSSL = process.env.DB_SSL === 'true';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendtrack_db',

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Return DATE columns as YYYY-MM-DD strings.
  dateStrings: true
};

// Enable SSL only when DB_SSL=true.
if (useSSL) {
  let caCertificate;

  if (process.env.DB_CA_CERT) {
    caCertificate = process.env.DB_CA_CERT.replace(/\\n/g, '\n');
  } else {
    const caPath = path.resolve(
      __dirname,
      '../../',
      process.env.DB_CA_PATH || 'certs/ca.pem'
    );

    if (!fs.existsSync(caPath)) {
      throw new Error(`MySQL CA certificate was not found at: ${caPath}`);
    }

    caCertificate = fs.readFileSync(caPath, 'utf8');
  }

  poolConfig.ssl = {
    ca: caCertificate,
    rejectUnauthorized: true
  };
}

const pool = mysql.createPool(poolConfig);

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query('SELECT 1');

    console.log('Successfully connected to the MySQL database pool.');
    console.log(`Database host: ${process.env.DB_HOST}`);
    console.log(`Database name: ${process.env.DB_NAME}`);

    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testConnection
};