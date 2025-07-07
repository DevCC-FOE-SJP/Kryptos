require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());
app.post('/api/blockfrost', async (req, res) => {
  const { endpoint, method, body, params, contentType } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Blockfrost endpoint is required.' });
  }
  if (!BLOCKFROST_API_KEY) {
    return res.status(500).json({ error: 'Blockfrost API key not configured on server.' });
  }

  const blockfrostBaseUrl = 'https://cardano-preprod.blockfrost.io/api/v0';

  try {
    let response;
    const headers = {
      'project_id': BLOCKFROST_API_KEY,
      'Content-Type': contentType || 'application/json'
    };

    const url = `${blockfrostBaseUrl}${endpoint}`;
    console.log(`Proxying ${method.toUpperCase()} request to:`, url);

    switch (method.toLowerCase()) {
      case 'get':
        response = await axios.get(url, { headers, params });
        break;
      case 'post':
        response = await axios.post(url, body, { headers, params });
        break;
      default:
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    console.log(`Blockfrost response status: ${response.status}`);
    
    // Log protocol parameters specifically
    if (endpoint.includes('parameters')) {
      console.log('Protocol parameters response:', JSON.stringify(response.data, null, 2));
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying Blockfrost request:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      res.status(503).json({ error: 'No response from Blockfrost API.' });
    } else {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on port ${PORT}`);
  console.log(`Blockfrost API Key: ${BLOCKFROST_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
});
