import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getAdminOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const data = db.getData();

    const totalBusinesses = data.businesses.length;
    const activeBusinesses = data.businesses.filter((b) => b.status === 'ACTIVE').length;
    const suspendedBusinesses = totalBusinesses - activeBusinesses;
    const totalUsers = data.users.length;
    const totalSalesAll = data.sales.filter((s) => !s.isCancelled).length;
    const totalVolumeAll = data.sales
      .filter((s) => !s.isCancelled)
      .reduce((acc, s) => acc + s.grandTotal, 0);

    return sendSuccess(res, {
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      totalUsers,
      totalSalesAll,
      totalVolumeAll: Math.round(totalVolumeAll * 100) / 100,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getAdminBusinesses(req: AuthenticatedRequest, res: Response) {
  try {
    const data = db.getData();

    const businesses = data.businesses.map((b) => {
      const ownerMembership = data.memberships.find((m) => m.businessId === b.id && m.role === 'OWNER');
      const ownerUser = ownerMembership ? data.users.find((u) => u.id === ownerMembership.userId) : null;
      const bizSales = data.sales.filter((s) => s.businessId === b.id && !s.isCancelled);
      const bizProducts = data.products.filter((p) => p.businessId === b.id && !p.isArchived);

      return {
        ...b,
        ownerName: ownerUser ? ownerUser.name : 'Unknown',
        ownerEmail: ownerUser ? ownerUser.email : b.email,
        totalSalesCount: bizSales.length,
        totalRevenue: Math.round(bizSales.reduce((acc, s) => acc + s.grandTotal, 0) * 100) / 100,
        totalProductsCount: bizProducts.length,
      };
    });

    return sendSuccess(res, businesses);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateBusinessStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Valid status (ACTIVE or SUSPENDED) is required', 400);
    }

    const data = db.getData();
    const business = data.businesses.find((b) => b.id === id);
    if (!business) {
      return sendError(res, 'Business not found', 404);
    }

    business.status = status;
    business.suspensionReason = status === 'SUSPENDED' ? (reason || 'Account suspended by Platform Administrator') : undefined;
    business.updatedAt = new Date().toISOString();

    data.auditLogs.push({
      id: `log_${Date.now()}`,
      businessId: business.id,
      userId: req.user!.id,
      userName: req.user!.name,
      action: status === 'ACTIVE' ? 'ACTIVATE_BUSINESS' : 'SUSPEND_BUSINESS',
      entityType: 'BUSINESS',
      entityId: business.id,
      details: { status, reason },
      createdAt: new Date().toISOString(),
    });

    db.save();

    return sendSuccess(
      res,
      business,
      `Business account ${business.name} is now ${status.toLowerCase()}`
    );
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getAdminAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const data = db.getData();
    const logs = [...data.auditLogs].reverse().slice(0, 50);
    return sendSuccess(res, logs);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
