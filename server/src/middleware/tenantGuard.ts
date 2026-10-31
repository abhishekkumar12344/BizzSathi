import { Response, NextFunction } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from './auth.js';
import { sendError } from '../utils/response.js';

export function tenantGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 'Authentication required before tenant resolution', 401);
  }

  // If super admin and no business selected, pass through
  const requestedBusinessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const data = db.getData();

  let membership = data.memberships.find(
    (m) => m.userId === req.user!.id && (requestedBusinessId ? m.businessId === requestedBusinessId : true)
  );

  // If user is PLATFORM_ADMIN, they can access any business if explicitly requested
  if (!membership && req.user.role === 'PLATFORM_ADMIN' && requestedBusinessId) {
    const business = data.businesses.find((b) => b.id === requestedBusinessId);
    if (business) {
      req.business = business;
      req.membership = {
        id: 'admin_virtual_membership',
        userId: req.user.id,
        businessId: business.id,
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      return next();
    }
  }

  if (!membership) {
    return sendError(res, 'No business associated with this user or invalid business ID', 403);
  }

  const business = data.businesses.find((b) => b.id === membership!.businessId);
  if (!business) {
    return sendError(res, 'Business record not found', 404);
  }

  if (business.status === 'SUSPENDED') {
    return sendError(
      res,
      `This business account has been suspended. Reason: ${business.suspensionReason || 'Violation of terms or overdue subscription'}. Please contact support.`,
      403
    );
  }

  req.business = business;
  req.membership = membership;
  return next();
}

export function requireRole(allowedRoles: ('OWNER' | 'MANAGER' | 'STAFF')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'PLATFORM_ADMIN') {
      return next();
    }

    if (!req.membership || !allowedRoles.includes(req.membership.role)) {
      return sendError(res, `Forbidden: Action requires one of [${allowedRoles.join(', ')}] permissions`, 403);
    }

    return next();
  };
}
