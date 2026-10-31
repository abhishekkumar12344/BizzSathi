import { Response } from 'express';
import { db, SupplierDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getSuppliers(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { search } = req.query;
    const data = db.getData();

    let suppliers = data.suppliers.filter((s) => s.businessId === businessId && !s.isArchived);

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      suppliers = suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
          s.phone.includes(q)
      );
    }

    const enriched = suppliers.map((s) => {
      const linkedProducts = data.products.filter(
        (p) => p.businessId === businessId && p.supplierId === s.id && !p.isArchived
      );
      return {
        ...s,
        productsSuppliedCount: linkedProducts.length,
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { name, contactPerson, phone, email, address, notes } = req.body;

    if (!name || !phone) {
      return sendError(res, 'Supplier name and phone number are required', 400);
    }

    const data = db.getData();
    const newSupplier: SupplierDoc = {
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      name: name.trim(),
      contactPerson: contactPerson?.trim() || '',
      phone: phone.trim(),
      email: email?.trim() || undefined,
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    data.suppliers.push(newSupplier);
    db.save();

    return sendSuccess(res, newSupplier, 'Supplier added successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, notes } = req.body;

    const data = db.getData();
    const supplier = data.suppliers.find((s) => s.id === id && s.businessId === businessId);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }

    if (name) supplier.name = name.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson.trim();
    if (phone) supplier.phone = phone.trim();
    if (email !== undefined) supplier.email = email?.trim() || undefined;
    if (address !== undefined) supplier.address = address.trim();
    if (notes !== undefined) supplier.notes = notes.trim();

    db.save();
    return sendSuccess(res, supplier, 'Supplier updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const supplier = data.suppliers.find((s) => s.id === id && s.businessId === businessId);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }

    supplier.isArchived = true;
    db.save();
    return sendSuccess(res, null, 'Supplier archived successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
