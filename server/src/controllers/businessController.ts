import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getBusiness(req: AuthenticatedRequest, res: Response) {
  try {
    const business = req.business!;
    return sendSuccess(res, business);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateBusiness(req: AuthenticatedRequest, res: Response) {
  try {
    const business = req.business!;
    const {
      name,
      businessType,
      phone,
      address,
      city,
      state,
      pincode,
      gstin,
      invoicePrefix,
      taxRatePercent,
      taxEnabled,
      upiId,
      bankDetails,
    } = req.body;

    if (name) business.name = name;
    if (businessType) business.businessType = businessType;
    if (phone) business.phone = phone;
    if (address !== undefined) business.address = address;
    if (city !== undefined) business.city = city;
    if (state !== undefined) business.state = state;
    if (pincode !== undefined) business.pincode = pincode;
    if (gstin !== undefined) business.gstin = gstin;
    if (invoicePrefix) business.invoicePrefix = invoicePrefix.toUpperCase();
    if (taxRatePercent !== undefined) business.taxRatePercent = Number(taxRatePercent);
    if (taxEnabled !== undefined) business.taxEnabled = Boolean(taxEnabled);
    if (upiId !== undefined) business.upiId = upiId;
    if (bankDetails) business.bankDetails = bankDetails;

    business.updatedAt = new Date().toISOString();
    db.save();

    return sendSuccess(res, business, 'Business settings updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
