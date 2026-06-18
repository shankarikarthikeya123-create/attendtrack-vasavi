const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('Starting server...');
  
  // Test MySQL connection pool
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('CRITICAL: Could not establish database connection. Server starting aborted.');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`AttendTrack Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Database Name: ${process.env.DB_NAME || 'attendtrack_db'}`);
    console.log(`===================================================`);
  });
}

startServer();
