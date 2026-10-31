import { Response } from 'express';
import { db, PaymentDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getPayments(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { customerId, method, startDate, endDate } = req.query;
    const data = db.getData();

    let payments = data.payments.filter((p) => p.businessId === businessId);

    if (customerId && typeof customerId === 'string') {
      payments = payments.filter((p) => p.customerId === customerId);
    }

    if (method && typeof method === 'string') {
      payments = payments.filter((p) => p.paymentMethod === method.toUpperCase());
    }

    if (startDate && typeof startDate === 'string') {
      payments = payments.filter((p) => p.paymentDate >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      payments = payments.filter((p) => p.paymentDate <= endDate);
    }

    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with customer and sale details
    const enriched = payments.map((p) => {
      const customer = data.customers.find((c) => c.id === p.customerId);
      const sale = p.saleId ? data.sales.find((s) => s.id === p.saleId) : null;
      return {
        ...p,
        customerName: customer ? customer.name : 'Walk-in Customer',
        invoiceNumber: sale ? sale.invoiceNumber : undefined,
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { customerId, saleId, amount, paymentMethod, referenceNumber, paymentDate, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return sendError(res, 'A positive payment amount is required', 400);
    }

    const data = db.getData();
    let customer = null;
    if (customerId && customerId !== 'walk_in') {
      customer = data.customers.find((c) => c.id === customerId && c.businessId === businessId);
      if (!customer) {
        return sendError(res, 'Customer not found', 404);
      }
    }

    let sale = null;
    if (saleId) {
      sale = data.sales.find((s) => s.id === saleId && s.businessId === businessId);
    }

    const now = new Date().toISOString();
    const newPayment: PaymentDoc = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      customerId: customer ? customer.id : 'walk_in',
      saleId: sale?.id,
      amount: Math.round(numAmount * 100) / 100,
      paymentMethod: paymentMethod || 'CASH',
      referenceNumber: referenceNumber?.trim() || undefined,
      paymentDate: paymentDate || now.split('T')[0],
      notes: notes?.trim() || '',
      createdBy: req.user!.id,
      createdAt: now,
    };

    data.payments.push(newPayment);

    // If linked to sale, adjust sale paid amount
    if (sale) {
      sale.paidAmount = Math.round((sale.paidAmount + numAmount) * 100) / 100;
      sale.balanceDue = Math.max(0, Math.round((sale.grandTotal - sale.paidAmount) * 100) / 100);
      if (sale.balanceDue === 0) {
        sale.paymentStatus = 'PAID';
      } else {
        sale.paymentStatus = 'PARTIAL';
      }
    }

    // Deduct from customer's outstanding balance
    if (customer) {
      customer.currentBalance = Math.max(0, Math.round((customer.currentBalance - numAmount) * 100) / 100);
      customer.updatedAt = now;
    }

    db.save();
    return sendSuccess(res, newPayment, 'Payment recorded and balance updated successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
