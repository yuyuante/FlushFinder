const https = require('https');

module.exports = (req, res) => {
  // 1. Try to read from Vercel's environment variables first (server-side secure storage)
  // 2. Fall back to user's custom key passed via query parameter
  const apiKey = process.env.MOENV_API_KEY || req.query.api_key;
  
  if (!apiKey) {
    res.status(400).json({ error: 'Missing API key. Please configure the MOENV_API_KEY environment variable on Vercel or pass the api_key parameter.' });
    return;
  }

  const moenvUrl = `https://data.moenv.gov.tw/api/v2/FAC_P_07?format=json&limit=500&api_key=${apiKey}`;
  console.log(`[Vercel Serverless] Proxying request to MOENV API`);
  
  https.get(moenvUrl, (apiRes) => {
    // Pipe response and append CORS headers
    res.writeHead(apiRes.statusCode || 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('[Vercel Serverless] Proxy Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch from MOENV API', details: err.message });
  });
};
