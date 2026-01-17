const express = require('express');
const app = express();

// Health check - MUST return 200 OK
app.get('/health', (req, res) => {
  console.log('✅ Health check called at:', new Date().toISOString());
  res.status(200).send('OK');
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'raastaX is working!',
    timestamp: new Date().toISOString(),
    port: 8080
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>raastaX</title>
      <style>
        body { 
          font-family: Arial; 
          padding: 40px; 
          text-align: center; 
          background: #f0f8ff;
        }
        h1 { color: #0b3c6d; }
        .status { 
          background: white; 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px auto; 
          max-width: 500px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <h1>🚀 raastaX</h1>
      <p>Travel Bookings Made Easy</p>
      
      <div class="status">
        <h2>✅ Server is Running!</h2>
        <p>Port: <strong>8080</strong></p>
        <p>Time: <span id="time"></span></p>
        <p>
          <a href="/health">Health Check</a> | 
          <a href="/test">Test API</a>
        </p>
      </div>
      
      <script>
        document.getElementById('time').textContent = new Date().toISOString();
      </script>
    </body>
    </html>
  `);
});

// Use PORT 8080 as your logs show
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ==================================
  🚀 raastaX Server Started!
  ✅ PORT: ${PORT}
  ✅ Time: ${new Date().toISOString()}
  ✅ Health: /health
  ==================================
  `);
});
