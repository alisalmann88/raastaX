const express = require('express');
const app = express();

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Test
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>raastaX on PORT 3000</h1>
        <p>If you see this, Railway is working!</p>
        <p>Port: 3000</p>
      </body>
    </html>
  `);
});

// FORCE PORT 3000 - ignore Railway's PORT variable
const PORT = 3000; // Hardcode to 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FORCED to port ${PORT}`);
  console.log(`✅ Railway URL: https://raastax-production.up.railway.app`);
});
