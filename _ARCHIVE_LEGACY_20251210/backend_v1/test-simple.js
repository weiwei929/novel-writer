const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(5000, () => {
  console.log('Simple test server running on port 5000');
});
