const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');
const url = require('url');

const PORT = 8080;
const KEY_PATH = path.join(__dirname, 'key.pem');
const CERT_PATH = path.join(__dirname, 'cert.pem');

// Define MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.jfif': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

async function getSSLOptions() {
    if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
        console.log('Generating self-signed SSL certificate...');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, { days: 365 });
        fs.writeFileSync(KEY_PATH, pems.private);
        fs.writeFileSync(CERT_PATH, pems.cert);
        console.log('SSL certificate generated successfully!');
    }
    return {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH)
    };
}

async function startServer() {
    const options = await getSSLOptions();

    const server = https.createServer(options, (req, res) => {
        const parsedUrl = url.parse(req.url, true);

        // API Proxy to MOENV Open Data V2 API (to bypass CORS)
        if (parsedUrl.pathname === '/api/toilets') {
            const apiKey = process.env.MOENV_API_KEY || parsedUrl.query.api_key;
            if (!apiKey) {
                res.writeHead(400, { 
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: 'Missing API key. Please configure the MOENV_API_KEY environment variable or pass the api_key parameter.' }));
                return;
            }

            const limit = parsedUrl.query.limit || 500;
            const offset = parsedUrl.query.offset || 0;
            const moenvUrl = `https://data.moenv.gov.tw/api/v2/FAC_P_07?format=json&limit=${limit}&offset=${offset}&api_key=${apiKey}`;
            console.log(`[API Proxy] Requesting: ${moenvUrl.replace(apiKey, 'HIDDEN_KEY')}`);
            
            https.get(moenvUrl, (apiRes) => {
                console.log(`[API Proxy] Response Status: ${apiRes.statusCode}`);
                
                res.writeHead(apiRes.statusCode || 200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                apiRes.pipe(res);
            }).on('error', (err) => {
                console.error('[API Proxy] Request Error:', err.message);
                res.writeHead(500, { 
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: 'Failed to fetch from MOENV API', details: err.message }));
            });
            return;
        }

        // Normalize URL path to prevent directory traversal
        let filePath = '.' + parsedUrl.pathname;
        if (filePath === './') {
            filePath = './index.html';
        }

        const absPath = path.resolve(__dirname, filePath);
        
        // Safety check: ensure the requested file is inside the workspace directory (prevent traversal)
        const relative = path.relative(__dirname, absPath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            res.writeHead(403);
            res.end('Access Denied');
            return;
        }

        const extname = String(path.extname(absPath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        fs.readFile(absPath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.end(content, 'utf-8');
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`\n==================================================`);
        console.log(`🚀 FlushFinder HTTPS Dev Server is running!`);
        console.log(`👉 https://localhost:${PORT}`);
        console.log(`==================================================\n`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
