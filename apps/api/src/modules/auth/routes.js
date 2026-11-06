import { Router } from 'express';
import { authService } from './service.js';
import { authRateLimiter } from '../../common/rateLimiter.js';
import { requireAuth } from '../../common/authMiddleware.js';
import { AppError } from '../../common/errors.js';
import { ERROR_CODES } from '@projectuk/shared';

export const authRouter = Router();

// Helper to set secure httpOnly cookies
function setAuthCookies(res, tokens) {
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth', // scoped only to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// Clear cookies
function clearAuthCookies(res) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
}

// POST /signup
authRouter.post('/signup', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email and password are required', 400);
    }

    const { user, tokens, verifyToken } = await authService.signup({ email, password, displayName });
    setAuthCookies(res, tokens);

    res.status(201).json({
      user,
      tokens,
      verifyToken, // In production, this is emailed to the user
      message: 'Signup successful. Please verify your email.'
    });
  } catch (err) {
    if (err.message.includes('already exists') || err.message.includes('Password must be at least')) {
      return next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
    }
    next(err);
  }
});

// POST /login
authRouter.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email and password are required', 400);
    }

    const { user, tokens } = await authService.login({ email, password });
    setAuthCookies(res, tokens);

    res.json({
      user,
      tokens,
      message: 'Login successful'
    });
  } catch (err) {
    if (err.message.includes('Invalid email or password')) {
      return next(new AppError(ERROR_CODES.UNAUTHORIZED, 'Invalid email or password', 401));
    }
    next(err);
  }
});

// POST /refresh
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Refresh token required', 401);
    }

    const { user, tokens } = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens);

    res.json({ user, tokens });
  } catch (err) {
    clearAuthCookies(res);
    next(new AppError(ERROR_CODES.UNAUTHORIZED, err.message, 401));
  }
});

// POST /logout
authRouter.post('/logout', (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  authService.logout(refreshToken);
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
});

// GET /session (returns current active session)
authRouter.get('/session', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /forgot-password
authRouter.post('/forgot-password', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Email is required', 400);
    }
    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /reset-password
authRouter.post('/reset-password', authRateLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Token and new password are required', 400);
    }
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (err) {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
  }
});

// GET /verify-email
authRouter.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Verification token is required', 400);
    }
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
  }
});
