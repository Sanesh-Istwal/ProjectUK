import crypto from 'crypto';
import { usersService } from '../users/service.js';
import { ROLES } from '@projectuk/shared';
import { getAuthConfig } from '../../common/propertiesLoader.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_project_uk_change_in_production_32bytes!';
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 mins
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class AuthService {
  constructor() {
    this.refreshTokens = new Map(); // token -> { userId, expiresAt }
    this.resetTokens = new Map(); // token -> { userId, expiresAt }
    this.verifyTokens = new Map(); // token -> { userId, expiresAt }
    this.initialized = false;
  }

  // Seed test accounts defined in auth.properties
  async initFromProperties() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const config = getAuthConfig();
      for (const account of config.seededUsers) {
        const existing = await usersService.findByEmail(account.email);
        if (!existing) {
          const passwordHash = await this.hashPassword(account.password);
          const user = await usersService.createUser({
            email: account.email,
            passwordHash,
            displayName: account.displayName,
            role: account.role
          });
          if (config.autoVerifyEmail) {
            await usersService.setEmailVerified(user.id, true);
          }
          console.log(`[Auth] Seeded local account from auth.properties: ${account.email} (${account.role})`);
        }
      }
    } catch (err) {
      console.warn(`[Auth] Warning: Could not seed from auth.properties:`, err.message);
    }
  }

  // Password hashing using Node.js crypto pbkdf2 (safe, zero-dependency, standard)
  async hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  async verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      if (!salt || !key) return resolve(false);

      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
      });
    });
  }

  // Token signing & verification (HMAC-SHA256)
  createToken(payload, ttlMs) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Date.now() + ttlMs;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyAccessToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

    if (signature !== expectedSig) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      throw new Error('Token has expired');
    }

    return payload;
  }

  generateTokens(user) {
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.createToken(tokenPayload, ACCESS_TOKEN_TTL_MS);
    const refreshToken = crypto.randomBytes(40).toString('hex');

    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS
    });

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_MS / 1000 };
  }

  async signup({ email, password, displayName }) {
    await this.initFromProperties();

    const config = getAuthConfig();
    if (!config.allowLocalSignup) {
      throw new Error('Local user registration is currently disabled via auth.properties');
    }

    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const passwordHash = await this.hashPassword(password);
    const userRole = config.defaultRole || ROLES.MEMBER;

    let user = await usersService.createUser({
      email,
      passwordHash,
      displayName,
      role: userRole
    });

    // Auto-verify email if enabled in auth.properties
    let verifyToken = null;
    if (config.autoVerifyEmail) {
      user = await usersService.setEmailVerified(user.id, true);
    } else {
      verifyToken = crypto.randomBytes(32).toString('hex');
      this.verifyTokens.set(verifyToken, {
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
    }

    const tokens = this.generateTokens(user);
    return { user, tokens, verifyToken };
  }

  async login({ email, password }) {
    await this.initFromProperties();

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await usersService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    return { user: usersService.toSafeUser(user), tokens };
  }

  async refresh(refreshToken) {
    const record = this.refreshTokens.get(refreshToken);
    if (!record || Date.now() > record.expiresAt) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('Invalid or expired refresh token');
    }

    const user = await usersService.findById(record.userId);
    if (!user) {
      this.refreshTokens.delete(refreshToken);
      throw new Error('User not found');
    }

    // Invalidate old refresh token (refresh token rotation)
    this.refreshTokens.delete(refreshToken);

    const tokens = this.generateTokens(user);
    return { user: usersService.toSafeUser(user), tokens };
  }

  logout(refreshToken) {
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }
  }

  async requestPasswordReset(email) {
    const user = await usersService.findByEmail(email);
    if (!user) {
      return { message: 'If this email exists, a reset link was sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetTokens.set(resetToken, {
      userId: user.id,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    return { message: 'If this email exists, a reset link was sent.', resetToken };
  }

  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword || newPassword.length < 8) {
      throw new Error('Invalid token or password too short (min 8 characters)');
    }

    const record = this.resetTokens.get(resetToken);
    if (!record || Date.now() > record.expiresAt) {
      this.resetTokens.delete(resetToken);
      throw new Error('Invalid or expired reset token');
    }

    const newHash = await this.hashPassword(newPassword);
    await usersService.updatePasswordHash(record.userId, newHash);
    this.resetTokens.delete(resetToken);

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(token) {
    const record = this.verifyTokens.get(token);
    if (!record || Date.now() > record.expiresAt) {
      this.verifyTokens.delete(token);
      throw new Error('Invalid or expired verification token');
    }

    await usersService.setEmailVerified(record.userId, true);
    this.verifyTokens.delete(token);

    return { message: 'Email verified successfully' };
  }
}

export const authService = new AuthService();
