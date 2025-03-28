// src/routes/admin.js
const express = require('express');
const router = express.Router();
const cronService = require('../services/cronService');
const logger = require('../utils/logger');

// Admin dashboard route
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Used Books Automation - Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .btn { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Used Books Automation Dashboard</h1>
        
        <div class="card">
          <h2>Manual Controls</h2>
          <button class="btn" id="scan-btn">Scan All Used Books</button>
          <p id="scan-status"></p>
        </div>
        
        <div class="card">
          <h2>System Status</h2>
          <div id="status-output">Loading...</div>
        </div>
      </div>
      
      <script>
        // Scan button handler
        document.getElementById('scan-btn').addEventListener('click', async () => {
          document.getElementById('scan-status').textContent = 'Scanning...';
          try {
            const response = await fetch('/api/scan-all', {
              method: 'POST'
            });
            const data = await response.json();
            document.getElementById('scan-status').textContent = data.message;
          } catch (error) {
            document.getElementById('scan-status').textContent = 'Error: ' + error.message;
          }
        });
        
        // Load status
        async function loadStatus() {
          try {
            const response = await fetch('/health');
            const data = await response.json();
            document.getElementById('status-output').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('status-output').textContent = 'Error: ' + error.message;
          }
        }
        
        loadStatus();
      </script>
    </body>
    </html>
  `);
});

// Add to app.js
app.use('/admin', router);