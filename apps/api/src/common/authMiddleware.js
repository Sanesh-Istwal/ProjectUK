import { AppError } from './errors.js';
import { ROLES, ERROR_CODES } from '@projectuk/shared';
import { authService } from '../modules/auth/service.js';

export function authenticate(req, res, next) {
  let token = null;

  // 1. Check cookies (httpOnly)
  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }
  // 2. Check Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
  } catch (err) {
    // Expired or invalid token
    req.user = null;
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return next(new AppError(ERROR_CODES.UNAUTHORIZED, 'Authentication required to access this resource', 401));
  }
  next();
}

// Role hierarchy rank for RBAC
const ROLE_RANK = {
  [ROLES.VISITOR]: 0,
  [ROLES.MEMBER]: 1,
  [ROLES.CONTRIBUTOR]: 2,
  [ROLES.MODERATOR]: 3,
  [ROLES.ADMIN]: 4
};

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(ERROR_CODES.UNAUTHORIZED, 'Authentication required', 401));
    }

    const userRole = req.user.role || ROLES.MEMBER;
    const hasRole = allowedRoles.some(role => {
      // Direct match or Admin super-privilege
      return userRole === role || userRole === ROLES.ADMIN || (ROLE_RANK[userRole] >= ROLE_RANK[role]);
    });

    if (!hasRole) {
      return next(new AppError(
        ERROR_CODES.FORBIDDEN,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        403
      ));
    }

    next();
  };
}

