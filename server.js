// server.js - Ultra simple Railway-compatible server
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (req.url === '/health' || req.url === '/health/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  // Serve simple HTML for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>raastaX</title>
      <style>
        body { font-family: Arial; padding: 40px; text-align: center; }
        h1 { color: #0b3c6d; }
        .status { 
          background: #f0f8ff; 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px; 
        }
      </style>
    </head>
    <body>
      <h1>🚀 raastaX</h1>
      <p>Travel Bookings Made Easy</p>
      
      <div class="status">
        <h2>✅ Server is Running!</h2>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Request URL: ${req.url}</p>
        <p>Health Check: <a href="/health">/health</a></p>
      </div>
    </body>
    </html>
  `);
});

// Railway will provide PORT via environment variable
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`✅ raastaX Server Started`);
  console.log(`✅ Listening on port: ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('='.repeat(50));
});
