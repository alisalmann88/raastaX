const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`✅ Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'OK',
      service: 'raastaX',
      domain: 'raastax-production.up.railway.app',
      port: 8080,
      timestamp: new Date().toISOString(),
      message: 'Server is running perfectly!'
    }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>raastaX - LIVE</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .status-card {
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-width: 600px;
          margin: 20px;
        }
        .success { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>🚀 raastaX</h1>
      <p>Travel Bookings Made Easy</p>
      
      <div class="status-card">
        <h2 class="success">✅ DEPLOYMENT SUCCESSFUL!</h2>
        <p><strong>Domain:</strong> raastax-production.up.railway.app</p>
        <p><strong>Port:</strong> 8080</p>
        <p><strong>Status:</strong> Running ✓</p>
        <p><strong>Time:</strong> <span id="time"></span></p>
        
        <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
          <p><a href="/health" style="color: #667eea; font-weight: bold;">Health Check API</a></p>
          <p>If you can see this page, your deployment is working!</p>
        </div>
      </div>
      
      <script>
        document.getElementById('time').textContent = new Date().toISOString();
        console.log('raastaX frontend loaded successfully');
      </script>
    </body>
    </html>
  `);
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 raastaX SERVER STARTED SUCCESSFULLY!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Public URL: https://raastax-production.up.railway.app`);
  console.log(`🏥 Health: https://raastax-production.up.railway.app/health`);
  console.log('='.repeat(60));
});
