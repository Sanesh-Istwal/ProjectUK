import { Router } from 'express';
import { usersService } from './service.js';
import { requireAuth, requireRole } from '../../common/authMiddleware.js';
import { AppError } from '../../common/errors.js';
import { ROLES, ERROR_CODES } from '@projectuk/shared';

export const usersRouter = Router();

// GET /api/v1/users/me (authenticated user profile)
usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await usersService.findSafeById(req.user.id);
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/me (update profile details)
usersRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { displayName, bio, avatarUrl } = req.body || {};
    const updated = await usersService.updateProfile(req.user.id, { displayName, bio, avatarUrl });
    res.json({ user: updated, message: 'Profile updated successfully' });
  } catch (err) {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
  }
});

// PATCH /api/v1/users/:id/role (assign role, requires Admin or Moderator)
usersRouter.patch('/:id/role', requireRole(ROLES.MODERATOR, ROLES.ADMIN), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Role is required', 400);
    }

    // Only Admin can assign Admin or Moderator roles
    if ((role === ROLES.ADMIN || role === ROLES.MODERATOR) && req.user.role !== ROLES.ADMIN) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'Only Admins can promote to Moderator or Admin', 403);
    }

    const updated = await usersService.updateRole(req.params.id, role);
    res.json({ user: updated, message: `User role updated to ${role}` });
  } catch (err) {
    next(new AppError(ERROR_CODES.VALIDATION_ERROR, err.message, 400));
  }
});

// GET /api/v1/users/:id (public profile)
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await usersService.findSafeById(req.params.id);
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'User not found', 404);
    }
    // Return only public fields
    res.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});
