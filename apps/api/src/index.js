import express from 'express';
import cors from 'cors';
import { errorHandler } from './common/errors.js';
import { authenticate } from './common/authMiddleware.js';
import { authRouter } from './modules/auth/routes.js';
import { authService } from './modules/auth/service.js';
import { usersRouter } from './modules/users/routes.js';
import { mapsRouter } from './modules/maps/routes.js';
import { contentRouter } from './modules/content/routes.js';
import { mediaRouter } from './modules/media/routes.js';

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS with credentials for cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Lightweight cookie parsing middleware (zero-dependency fallback)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (key) req.cookies[key] = decodeURIComponent(val);
    });
  }
  next();
});

// Populate req.user if valid token exists
app.use(authenticate);

// API v1 routes
const v1Router = express.Router();

v1Router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/maps', mapsRouter);
v1Router.use('/content', contentRouter);
v1Router.use('/media', mediaRouter);

app.use('/api/v1', v1Router);

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  authService.initFromProperties().then(() => {
    app.listen(port, () => {
      console.log(`[ProjectUK API] Server running on http://localhost:${port}`);
      console.log(`[ProjectUK API] Health endpoint: http://localhost:${port}/api/v1/health`);
    });
  });
}

export default app;
