import { Response } from 'express';
import { db, SaleDoc, SaleItemDoc, StockMovementDoc, PaymentDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getSales(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { status, search, startDate, endDate } = req.query;
    const data = db.getData();

    let sales = data.sales.filter((s) => s.businessId === businessId);

    if (status && typeof status === 'string') {
      sales = sales.filter((s) => s.paymentStatus === status.toUpperCase());
    }

    if (startDate && typeof startDate === 'string') {
      sales = sales.filter((s) => s.createdAt >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      sales = sales.filter((s) => s.createdAt <= endDate + 'T23:59:59.999Z');
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      sales = sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerSnapshot.name.toLowerCase().includes(q) ||
          s.customerSnapshot.phone.includes(q)
      );
    }

    // Sort newest first
    sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sendSuccess(res, sales);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function getSaleById(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const sale = data.sales.find((s) => s.id === id && s.businessId === businessId);
    if (!sale) {
      return sendError(res, 'Invoice not found', 404);
    }

    const business = req.business!;
    const payments = data.payments.filter((p) => p.saleId === sale.id);

    return sendSuccess(res, {
      sale,
      business,
      payments,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createSale(req: AuthenticatedRequest, res: Response) {
  try {
    const business = req.business!;
    const businessId = business.id;
    const data = db.getData();

    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items, // array of { productId, quantity, discount }
      taxRatePercent,
      paidAmount,
      paymentMethod,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'At least one product item is required to generate an invoice', 400);
    }

    // Resolve Customer
    let resolvedCustomerName = 'Walk-in Retail Customer';
    let resolvedCustomerPhone = 'Counter Sale';
    let resolvedCustomerAddress = '';
    let customerDoc = null;

    if (customerId) {
      customerDoc = data.customers.find((c) => c.id === customerId && c.businessId === businessId);
      if (customerDoc) {
        resolvedCustomerName = customerDoc.name;
        resolvedCustomerPhone = customerDoc.phone;
        resolvedCustomerAddress = customerDoc.billingAddress || '';
      }
    } else if (customerName) {
      resolvedCustomerName = customerName.trim();
      resolvedCustomerPhone = customerPhone?.trim() || 'Counter Sale';
      resolvedCustomerAddress = customerAddress?.trim() || '';
    }

    // Validate Stock & Recalculate Totals Server-Side
    const calculatedItems: SaleItemDoc[] = [];
    let calculatedSubtotal = 0;
    let calculatedTotalDiscount = 0;

    for (const line of items) {
      const product = data.products.find((p) => p.id === line.productId && p.businessId === businessId && !p.isArchived);
      if (!product) {
        return sendError(res, `Product not found or archived: ${line.productId}`, 400);
      }

      const qty = Number(line.quantity);
      if (isNaN(qty) || qty <= 0) {
        return sendError(res, `Invalid quantity for product "${product.name}"`, 400);
      }

      // Check stock
      if (product.currentStock < qty) {
        return sendError(
          res,
          `Insufficient stock for "${product.name}". Available: ${product.currentStock} ${product.unit}, Requested: ${qty}`,
          400
        );
      }

      const unitPrice = product.sellingPrice;
      const lineDiscount = Math.max(0, Number(line.discount || 0));
      const lineSubtotal = Math.max(0, qty * unitPrice - lineDiscount);

      calculatedSubtotal += qty * unitPrice;
      calculatedTotalDiscount += lineDiscount;

      calculatedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        unit: product.unit,
        unitPrice,
        purchaseCostSnapshot: product.purchaseCost,
        discount: lineDiscount,
        tax: 0, // line tax if any, or distributed
        total: Math.round(lineSubtotal * 100) / 100,
      });
    }

    // Tax calculation
    const effectiveTaxRate = taxRatePercent !== undefined ? Number(taxRatePercent) : (business.taxEnabled ? business.taxRatePercent : 0);
    const taxableAmount = Math.max(0, calculatedSubtotal - calculatedTotalDiscount);
    const calculatedTotalTax = Math.round((taxableAmount * (effectiveTaxRate / 100)) * 100) / 100;
    const calculatedGrandTotal = Math.round((taxableAmount + calculatedTotalTax) * 100) / 100;

    // Payment validation
    const requestedPaidAmount = Number(paidAmount || 0);
    const finalPaidAmount = Math.min(calculatedGrandTotal, Math.max(0, requestedPaidAmount));
    const balanceDue = Math.round((calculatedGrandTotal - finalPaidAmount) * 100) / 100;

    let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
    if (balanceDue === 0) {
      paymentStatus = 'PAID';
    } else if (finalPaidAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }

    // Allocate Sequential Invoice Number
    const invNumber = `${business.invoicePrefix}-${business.invoiceNextNumber}`;
    business.invoiceNextNumber += 1;
    business.updatedAt = new Date().toISOString();

    const now = new Date().toISOString();
    const saleId = `sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Build Sale document
    const newSale: SaleDoc = {
      id: saleId,
      businessId,
      invoiceNumber: invNumber,
      customerId: customerDoc?.id,
      customerSnapshot: {
        name: resolvedCustomerName,
        phone: resolvedCustomerPhone,
        address: resolvedCustomerAddress,
      },
      items: calculatedItems,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      totalDiscount: Math.round(calculatedTotalDiscount * 100) / 100,
      taxRatePercent: effectiveTaxRate,
      totalTax: calculatedTotalTax,
      grandTotal: calculatedGrandTotal,
      paidAmount: finalPaidAmount,
      balanceDue,
      paymentStatus,
      paymentMethod: paymentMethod || (finalPaidAmount > 0 ? 'CASH' : 'CREDIT'),
      notes: notes?.trim() || '',
      isCancelled: false,
      createdBy: req.user!.id,
      createdAt: now,
    };

    // Atomic Updates:
    // 1. Decrement inventory and record stock movements
    for (const line of calculatedItems) {
      const prod = data.products.find((p) => p.id === line.productId)!;
      prod.currentStock -= line.quantity;
      prod.updatedAt = now;

      const movement: StockMovementDoc = {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        businessId,
        productId: prod.id,
        type: 'SALE',
        quantity: -line.quantity,
        balanceAfter: prod.currentStock,
        referenceId: invNumber,
        notes: `Invoice #${invNumber} - ${resolvedCustomerName}`,
        createdBy: req.user!.id,
        createdAt: now,
      };
      data.stockMovements.push(movement);
    }

    // 2. Record payment if paidAmount > 0
    if (finalPaidAmount > 0) {
      const payment: PaymentDoc = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        businessId,
        saleId,
        customerId: customerDoc ? customerDoc.id : 'walk_in',
        amount: finalPaidAmount,
        paymentMethod: paymentMethod || 'CASH',
        referenceNumber: `INV-${invNumber}`,
        paymentDate: now.split('T')[0],
        notes: `Initial payment for invoice #${invNumber}`,
        createdBy: req.user!.id,
        createdAt: now,
      };
      data.payments.push(payment);
    }

    // 3. Update customer running balance if credit/partial
    if (customerDoc && balanceDue > 0) {
      customerDoc.currentBalance += balanceDue;
      customerDoc.updatedAt = now;
    }

    // 4. Save sale
    data.sales.push(newSale);
    db.save();

    return sendSuccess(res, newSale, `Invoice #${invNumber} generated successfully`, 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function cancelSale(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const { reason } = req.body;
    const data = db.getData();

    const sale = data.sales.find((s) => s.id === id && s.businessId === businessId);
    if (!sale) {
      return sendError(res, 'Invoice not found', 404);
    }

    if (sale.isCancelled) {
      return sendError(res, 'Invoice is already cancelled', 400);
    }

    const now = new Date().toISOString();
    sale.isCancelled = true;
    sale.cancelledAt = now;
    sale.cancellationReason = reason || 'Cancelled by store owner';

    // Reverse inventory movements
    for (const item of sale.items) {
      const product = data.products.find((p) => p.id === item.productId && p.businessId === businessId);
      if (product) {
        product.currentStock += item.quantity;
        product.updatedAt = now;

        const movement: StockMovementDoc = {
          id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          businessId,
          productId: product.id,
          type: 'RETURN',
          quantity: item.quantity,
          balanceAfter: product.currentStock,
          referenceId: sale.invoiceNumber,
          notes: `Reversal for cancelled invoice #${sale.invoiceNumber}`,
          createdBy: req.user!.id,
          createdAt: now,
        };
        data.stockMovements.push(movement);
      }
    }

    // Reverse customer balance if credit was pending
    if (sale.customerId && sale.balanceDue > 0) {
      const customer = data.customers.find((c) => c.id === sale.customerId && c.businessId === businessId);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - sale.balanceDue);
        customer.updatedAt = now;
      }
    }

    db.save();
    return sendSuccess(res, sale, `Invoice #${sale.invoiceNumber} has been cancelled and inventory returned to stock.`);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
