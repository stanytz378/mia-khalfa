const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            bot: 'MIA KHALIFA',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            platform: os.platform(),
            node: process.version,
            timestamp: new Date().toISOString()
        }));
    } else if (req.url === '/stats') {
        // Optional: gather stats from bot (commands count, etc.)
        const stats = {
            commands: global.commandCount || 0,
            uptime: process.uptime()
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function startServer() {
    server.listen(PORT, () => {
        console.log(`🌐 HTTP server listening on port ${PORT}`);
    });
}

module.exports = { startServer };