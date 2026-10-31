import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, UserDoc, BusinessDoc, BusinessMembershipDoc } from '../db/store.js';
import { sendError } from '../utils/response.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'bizsathi_super_secure_jwt_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: UserDoc;
  business?: BusinessDoc;
  membership?: BusinessMembershipDoc;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. Please provide a valid Bearer token.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = db.getData().users.find((u) => u.id === decoded.userId);

    if (!user) {
      return sendError(res, 'User not found or token invalid', 401);
    }

    if (user.status === 'SUSPENDED') {
      return sendError(res, 'Your user account has been suspended by the platform administrator.', 403);
    }

    req.user = user;
    return next();
  } catch (err) {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
    return sendError(res, 'Access denied. Platform Super Admin credentials required.', 403);
  }
  return next();
}
