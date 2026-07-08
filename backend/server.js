// Override Node's default DNS servers to Google Public DNS to prevent local network resolution failures for Atlas SRV subdomains
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express         = require('express');
const mongoose        = require('mongoose');
const cors            = require('cors');
const helmet          = require('helmet');
const rateLimit       = require('express-rate-limit');
const morgan          = require('morgan');
const path            = require('path');
const winston         = require('winston');

const app = express();
app.set('trust proxy', 1);

// ── Logger ──────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// ── Security Middleware ──────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow localhost and any Vercel deployments
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
}));

// ── Static Uploads ───────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MongoDB ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('✅  MongoDB connection established successfully'))
  .catch(err => { logger.error('MongoDB error:', err); process.exit(1); });

// ── Routes ───────────────────────────────────────────────────────
const { authenticate, isStaff } = require('./middleware/auth');

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/customer',      require('./routes/customer'));
app.use('/api/applications',  require('./routes/applications'));
app.use('/api/kyc',           require('./routes/kyc'));
app.use('/api/eligibility',   require('./routes/eligibility'));
app.use('/api/admin',         authenticate, isStaff, require('./routes/admin'));
app.use('/api/reports',       authenticate, isStaff, require('./routes/reports'));
app.use('/api/notifications', authenticate, isStaff, require('./routes/notifications'));
app.use('/api/leads',         authenticate, isStaff, require('./routes/leads'));

// ── Serve Frontend Static Files in Production ─────────────────────
const frontendBuildPath = path.join(__dirname, 'build');
app.use(express.static(frontendBuildPath));

// ── Health ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'OK', service: 'SBI CC Onboarding API', version: '2.0.0',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString(),
}));

// Fallback for non-API routes to serve React frontend's index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const fs = require('fs');
  const indexHtmlPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SBI CC Onboarding Portal</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #F8FAFC; color: #1E293B; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 500px; text-align: center; border: 1px solid #E2E8F0; }
          h1 { color: #0B1F45; margin-bottom: 16px; font-size: 24px; }
          p { color: #64748B; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .code { background: #F1F5F9; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #0F172A; text-align: left; word-break: break-all; margin-bottom: 24px; }
          .badge { background: #DBEAFE; color: #1E40AF; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">API Server Running</div>
          <h1>Frontend Build Missing</h1>
          <p>The backend API server is running successfully, but the compiled frontend static files were not found. To resolve this, make sure your Render Build Command is set to build both the backend and frontend:</p>
          <div class="code">npm install && npm run build</div>
          <p>Once updated, Render will compile the React application and serve the portal.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const http            = require('http');
const { Server }      = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  logger.info(`🔌 Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

// Attach io to Express app to make it accessible in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`🚀  API & WebSockets running on port ${PORT}`));
module.exports = app;
