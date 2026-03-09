const { app, start } = require('./src/app');

// When run directly (npm start / nodemon), start full server with MQTT + Socket.IO
if (require.main === module) {
  start();
}

// Vercel serverless: export Express app (lazy DB via middleware in app.js)
module.exports = app;
