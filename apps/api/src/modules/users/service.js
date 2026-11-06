import crypto from 'crypto';
import { ROLES } from '@projectuk/shared';

class UsersService {
  constructor() {
    // In-memory user store for dev/testing; plugs into PostgreSQL in Phase 3
    this.users = new Map();
  }

  async createUser({ email, passwordHash, displayName, role = ROLES.MEMBER }) {
    const normalizedEmail = email.toLowerCase().trim();

    if (await this.findByEmail(normalizedEmail)) {
      throw new Error('A user with this email already exists');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const user = {
      id,
      email: normalizedEmail,
      passwordHash,
      displayName: displayName || normalizedEmail.split('@')[0],
      bio: '',
      avatarUrl: null,
      role,
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(id, user);
    return this.toSafeUser(user);
  }

  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findSafeById(id) {
    const user = await this.findById(id);
    return user ? this.toSafeUser(user) : null;
  }

  async updateProfile(id, updates) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
    user.updatedAt = new Date().toISOString();

    this.users.set(id, user);
    return this.toSafeUser(user);
  }

  async updateRole(id, newRole) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    user.role = newRole;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    return this.toSafeUser(user);
  }

  async updatePasswordHash(id, newPasswordHash) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
  }

  async setEmailVerified(id, isEmailVerified = true) {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    user.isEmailVerified = isEmailVerified;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    return this.toSafeUser(user);
  }

  toSafeUser(user) {
    // Exclude passwordHash and internal tokens
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export const usersService = new UsersService();

