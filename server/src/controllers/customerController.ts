import { Response } from 'express';
import { db, CustomerDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { search } = req.query;
    const data = db.getData();

    let customers = data.customers.filter((c) => c.businessId === businessId);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    // Attach total sales count and total lifetime spend
    const enriched = customers.map((c) => {
      const custSales = data.sales.filter((s) => s.businessId === businessId && s.customerId === c.id && !s.isCancelled);
      const lifetimeSpend = custSales.reduce((acc, s) => acc + s.grandTotal, 0);
      return {
        ...c,
        totalBills: custSales.length,
        lifetimeSpend: Math.round(lifetimeSpend * 100) / 100,
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { name, phone, email, billingAddress, openingBalance, notes } = req.body;

    if (!name || !phone) {
      return sendError(res, 'Customer name and phone number are required', 400);
    }

    const data = db.getData();
    const existing = data.customers.find(
      (c) => c.businessId === businessId && c.phone === phone.trim()
    );

    if (existing) {
      return sendError(res, `A customer with phone "${phone.trim()}" already exists (${existing.name}).`, 409);
    }

    const initialBalance = Number(openingBalance || 0);
    const now = new Date().toISOString();

    const newCustomer: CustomerDoc = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || undefined,
      billingAddress: billingAddress?.trim() || '',
      openingBalance: initialBalance,
      currentBalance: initialBalance,
      notes: notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    data.customers.push(newCustomer);
    db.save();

    return sendSuccess(res, newCustomer, 'Customer created successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const { name, phone, email, billingAddress, notes } = req.body;

    const data = db.getData();
    const customer = data.customers.find((c) => c.id === id && c.businessId === businessId);
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email?.trim() || undefined;
    if (billingAddress !== undefined) customer.billingAddress = billingAddress.trim();
    if (notes !== undefined) customer.notes = notes.trim();

    customer.updatedAt = new Date().toISOString();
    db.save();

    return sendSuccess(res, customer, 'Customer updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getCustomerLedger(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const customer = data.customers.find((c) => c.id === id && c.businessId === businessId);
    if (!customer) {
      return sendError(res, 'Customer not found', 404);
    }

    // Get all sales for customer
    const sales = data.sales.filter((s) => s.businessId === businessId && s.customerId === id);
    // Get all payments for customer
    const payments = data.payments.filter((p) => p.businessId === businessId && p.customerId === id);

    // Build timeline entries
    const ledgerEntries: any[] = [];

    // Opening balance entry if non-zero
    if (customer.openingBalance > 0) {
      ledgerEntries.push({
        id: 'opening_bal',
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        description: 'Account Opening Balance',
        debit: customer.openingBalance, // Customer owes
        credit: 0,
        reference: '-',
      });
    }

    sales.forEach((s) => {
      ledgerEntries.push({
        id: `sale_${s.id}`,
        date: s.createdAt,
        type: 'INVOICE',
        description: `Invoice #${s.invoiceNumber} (${s.items.length} items)`,
        debit: s.grandTotal, // Bill amount added to balance
        credit: 0,
        reference: s.invoiceNumber,
        status: s.paymentStatus,
        isCancelled: s.isCancelled,
      });
    });

    payments.forEach((p) => {
      ledgerEntries.push({
        id: `pay_${p.id}`,
        date: p.paymentDate || p.createdAt,
        type: 'PAYMENT',
        description: `Payment via ${p.paymentMethod} ${p.notes ? `(${p.notes})` : ''}`,
        debit: 0,
        credit: p.amount, // Payment subtracted from balance
        reference: p.referenceNumber || p.id,
      });
    });

    // Sort by date ascending to calculate running balance
    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const computedTimeline = ledgerEntries.map((entry) => {
      if (!entry.isCancelled) {
        runningBalance += entry.debit - entry.credit;
      }
      return {
        ...entry,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    return sendSuccess(res, {
      customer,
      currentBalance: Math.round(customer.currentBalance * 100) / 100,
      totalBilled: sales.filter((s) => !s.isCancelled).reduce((acc, s) => acc + s.grandTotal, 0),
      totalPaid: payments.reduce((acc, p) => acc + p.amount, 0),
      timeline: computedTimeline.reverse(), // Show newest first in table
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
