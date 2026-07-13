const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const proxy = httpProxy.createProxyServer({ changeOrigin: true });

const PORT = 3000;
const DEV_SERVERS = {
  landing: 'http://localhost:8080',
  voiceApi: 'http://localhost:8085',    // backend-server.js (/api/voice)
  resolveApi: 'http://localhost:8086',  // backend-resolve.js (/api/resolve)
  adminApi: 'http://localhost:8087',  // backend-admin.js (/api/admin)
  voice: 'http://localhost:8082',       // Campus Voice frontend
  resolve: 'http://localhost:8083',     // Campus Resolve frontend
  admin: 'http://localhost:8084',       // Campus Admin frontend
};

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route requests based on path
app.use('/', (req, res) => {
  const path = req.path;

  // Route API requests to correct backend servers
  // Auth routes can go to any backend (they're all registered)
  // Route based on Referer header if available
  const referer = req.headers.referer || '';
  if (path.startsWith('/api/auth')) {
    req.url = path;
    if (referer.includes('/admin')) {
      return proxy.web(req, res, { target: DEV_SERVERS.adminApi });
    } else if (referer.includes('/resolve')) {
      return proxy.web(req, res, { target: DEV_SERVERS.resolveApi });
    }
    return proxy.web(req, res, { target: DEV_SERVERS.voiceApi });
  }

  if (path.startsWith('/api/admin')) {
    req.url = path;
    console.log(`[PROXY] Routing /api/admin request to ${DEV_SERVERS.adminApi}`);
    console.log(`[PROXY] Auth header present:`, !!req.headers.authorization);
    return proxy.web(req, res, { target: DEV_SERVERS.adminApi });
  }

  if (path.startsWith('/api/storage')) {
    req.url = path;
    // Route storage requests based on Referer (resolve staff vs voice student)
    if (referer.includes('/resolve')) {
      return proxy.web(req, res, { target: DEV_SERVERS.resolveApi });
    }
    return proxy.web(req, res, { target: DEV_SERVERS.voiceApi });
  }

  if (path.startsWith('/api/voice')) {
    req.url = path;
    return proxy.web(req, res, { target: DEV_SERVERS.voiceApi });
  }

  if (path.startsWith('/api/resolve')) {
    req.url = path;
    return proxy.web(req, res, { target: DEV_SERVERS.resolveApi });
  }

  // Route frontend paths to their respective apps
  if (path.startsWith('/voice')) {
    req.url = path; // preserve full path including /voice
    return proxy.web(req, res, { target: DEV_SERVERS.voice });
  }

  if (path.startsWith('/resolve')) {
    req.url = path;
    return proxy.web(req, res, { target: DEV_SERVERS.resolve });
  }

  if (path.startsWith('/admin')) {
    req.url = path;
    return proxy.web(req, res, { target: DEV_SERVERS.admin });
  }

  // Default to landing page
  proxy.web(req, res, { target: DEV_SERVERS.landing });
});

// Error handling
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.status(503).json({
    error: 'Service unavailable',
    message: 'One or more backend services are not running',
    details: 'Make sure to run: pnpm dev:apps',
  });
});

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Unified Routing Proxy                                 ║
╠════════════════════════════════════════════════════════╣
║  Proxy Server: http://localhost:${PORT}                    ║
║  ├─ http://localhost:${PORT}/           → Landing         ║
║  ├─ http://localhost:${PORT}/voice/*    → Campus Voice    ║
║  ├─ http://localhost:${PORT}/resolve/*  → Campus Resolve  ║
║  └─ http://localhost:${PORT}/admin/*    → Campus Admin    ║
║                                                        ║
║  Dev Servers (internal):                               ║
║  ├─ Landing: http://localhost:8080                     ║
║  ├─ Voice: http://localhost:8082                       ║
║  ├─ Resolve: http://localhost:8083                     ║
║  └─ Admin: http://localhost:8084                       ║
║                                                        ║
║  Make sure to run: pnpm dev:apps                       ║
║  in another terminal to start all dev servers         ║
╚════════════════════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Proxy] Port ${PORT} is already in use. Please close the other process or change the PORT.`);
  } else {
    console.error('[Proxy] Server error:', err);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[Proxy] Shutting down gracefully...');
  process.exit(0);
});
