const https = require('https');
const url = require('url');

module.exports = (req, res) => {
  const { data } = req.query;
  if (!data) {
    res.status(400).json({ error: 'Missing data parameter' });
    return;
  }

  // Active public Overpass API global mirrors (limit to 2 key mirrors to allocate longer timeout)
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  function tryEndpoint(index) {
    if (index >= endpoints.length) {
      res.status(502).json({ error: 'All Overpass API mirrors failed to respond on backend' });
      return;
    }

    const targetUrl = endpoints[index];
    const parsedUrl = url.parse(targetUrl);
    const path = `${parsedUrl.path}?data=${encodeURIComponent(data)}`;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'FlushFinderApp/1.0 (contact@flushfinder.xyz)',
        'Accept': 'application/json'
      }
    };

    console.log(`[Vercel Serverless OSM] Trying mirror: ${targetUrl}`);

    // Lock flag to prevent double-callbacks
    let resolved = false;

    const clientReq = https.request(reqOptions, (apiRes) => {
      if (resolved) return;

      if (apiRes.statusCode === 200) {
        resolved = true;
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        apiRes.pipe(res);
      } else {
        console.warn(`[Vercel Serverless OSM] Mirror ${targetUrl} failed with status ${apiRes.statusCode}`);
        resolved = true;
        tryEndpoint(index + 1);
      }
    });

    clientReq.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      console.warn(`[Vercel Serverless OSM] Mirror ${targetUrl} error: ${err.message}`);
      tryEndpoint(index + 1);
    });

    // Set a timeout of 4.5 seconds per mirror to stay safely under Vercel's 10-second limit
    clientReq.setTimeout(4500, () => {
      if (resolved) return;
      resolved = true;
      console.warn(`[Vercel Serverless OSM] Mirror ${targetUrl} timeout`);
      clientReq.destroy();
      tryEndpoint(index + 1);
    });

    clientReq.end();
  }

  tryEndpoint(0);
};
