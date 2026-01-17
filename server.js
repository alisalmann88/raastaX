const express = require('express');
const app = express();

// Simple response for ALL routes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// All other routes
app.get('*', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>✅ raastaX is RUNNING!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Request: ${req.url}</p>
        <p><a href="/health">Health Check</a></p>
      </body>
    </html>
  `);
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server forced to port ${PORT}`);
});
