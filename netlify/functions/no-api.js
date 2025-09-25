const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const serverless = require('serverless-http');

const app = express();
app.set('trust proxy', true);

// Load reasons from JSON
const reasonsPath = path.join(process.cwd(), 'reasons.json');
const reasons = JSON.parse(fs.readFileSync(reasonsPath, 'utf-8'));

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['x-nf-client-connection-ip'] || req.headers['client-ip'] || req.ip;
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

// Random rejection reason endpoint
app.get('/no', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  res.json({ reason });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'No-as-a-Service API',
    endpoints: {
      '/no': 'Get a random rejection reason'
    }
  });
});

// Export the serverless function
module.exports.handler = serverless(app);
