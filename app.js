// app.js - Ultra simple server
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <body>
        <h1>raastaX - Simple Test</h1>
        <p>Your app is working!</p>
        <p><a href="/health">Health Check</a></p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server on port ${PORT}`);
});
