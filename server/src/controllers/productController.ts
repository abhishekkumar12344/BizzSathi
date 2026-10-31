import { Response } from 'express';
import { db, ProductDoc, StockMovementDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { categoryId, lowStock, search } = req.query;
    const data = db.getData();

    let products = data.products.filter((p) => p.businessId === businessId && !p.isArchived);

    if (categoryId && typeof categoryId === 'string') {
      products = products.filter((p) => p.categoryId === categoryId);
    }

    if (lowStock === 'true') {
      products = products.filter((p) => p.currentStock <= p.minStockThreshold);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    // Attach category name
    const enriched = products.map((p) => {
      const cat = data.categories.find((c) => c.id === p.categoryId);
      return {
        ...p,
        categoryName: cat ? cat.name : 'General',
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const {
      name,
      categoryId,
      sku,
      barcode,
      description,
      unit,
      sellingPrice,
      purchaseCost,
      currentStock,
      minStockThreshold,
      supplierId,
    } = req.body;

    if (!name || !sellingPrice) {
      return sendError(res, 'Product name and selling price are required', 400);
    }

    const data = db.getData();

    // Check SKU uniqueness within business if SKU provided
    const finalSku = sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString().slice(-6)}`;
    const duplicateSku = data.products.find(
      (p) => p.businessId === businessId && !p.isArchived && p.sku.toUpperCase() === finalSku
    );

    if (duplicateSku) {
      return sendError(res, `A product with SKU "${finalSku}" already exists in your inventory.`, 409);
    }

    const now = new Date().toISOString();
    const newProduct: ProductDoc = {
      id: `prd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      categoryId: categoryId || data.categories.find((c) => c.businessId === businessId)?.id || 'cat_default',
      name: name.trim(),
      sku: finalSku,
      barcode: barcode?.trim() || undefined,
      description: description?.trim() || '',
      unit: (unit || 'PCS').toUpperCase(),
      sellingPrice: Number(sellingPrice),
      purchaseCost: Number(purchaseCost || 0),
      currentStock: Number(currentStock || 0),
      minStockThreshold: Number(minStockThreshold || 5),
      supplierId: supplierId || undefined,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    data.products.push(newProduct);

    // Initial stock movement record if initial stock > 0
    if (newProduct.currentStock > 0) {
      const movement: StockMovementDoc = {
        id: `sm_${Date.now()}`,
        businessId,
        productId: newProduct.id,
        type: 'PURCHASE',
        quantity: newProduct.currentStock,
        balanceAfter: newProduct.currentStock,
        notes: 'Initial inventory entry',
        createdBy: req.user!.id,
        createdAt: now,
      };
      data.stockMovements.push(movement);
    }

    db.save();
    return sendSuccess(res, newProduct, 'Product created successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const product = data.products.find((p) => p.id === id && p.businessId === businessId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const {
      name,
      categoryId,
      sku,
      barcode,
      description,
      unit,
      sellingPrice,
      purchaseCost,
      minStockThreshold,
      supplierId,
    } = req.body;

    if (name) product.name = name.trim();
    if (categoryId) product.categoryId = categoryId;
    if (sku) {
      const formattedSku = sku.trim().toUpperCase();
      const duplicateSku = data.products.find(
        (p) => p.id !== id && p.businessId === businessId && !p.isArchived && p.sku.toUpperCase() === formattedSku
      );
      if (duplicateSku) {
        return sendError(res, `Another product already uses SKU "${formattedSku}"`, 409);
      }
      product.sku = formattedSku;
    }
    if (barcode !== undefined) product.barcode = barcode?.trim() || undefined;
    if (description !== undefined) product.description = description;
    if (unit) product.unit = unit.toUpperCase();
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (purchaseCost !== undefined) product.purchaseCost = Number(purchaseCost);
    if (minStockThreshold !== undefined) product.minStockThreshold = Number(minStockThreshold);
    if (supplierId !== undefined) product.supplierId = supplierId || undefined;

    product.updatedAt = new Date().toISOString();
    db.save();

    return sendSuccess(res, product, 'Product updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function adjustStock(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const { adjustmentQuantity, reason, notes } = req.body;

    if (adjustmentQuantity === undefined || adjustmentQuantity === 0) {
      return sendError(res, 'A non-zero adjustment quantity is required', 400);
    }

    const data = db.getData();
    const product = data.products.find((p) => p.id === id && p.businessId === businessId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const newStock = product.currentStock + Number(adjustmentQuantity);
    if (newStock < 0) {
      return sendError(res, `Cannot deduct ${Math.abs(adjustmentQuantity)}: current stock is only ${product.currentStock}`, 400);
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();

    const movement: StockMovementDoc = {
      id: `sm_${Date.now()}`,
      businessId,
      productId: product.id,
      type: 'ADJUSTMENT',
      quantity: Number(adjustmentQuantity),
      balanceAfter: newStock,
      notes: `${reason || 'Manual Adjustment'}: ${notes || ''}`.trim(),
      createdBy: req.user!.id,
      createdAt: new Date().toISOString(),
    };

    data.stockMovements.push(movement);
    db.save();

    return sendSuccess(res, { product, movement }, 'Stock updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const product = data.products.find((p) => p.id === id && p.businessId === businessId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Soft delete (archive) to preserve historical billing integrity
    product.isArchived = true;
    product.updatedAt = new Date().toISOString();
    db.save();

    return sendSuccess(res, null, 'Product archived successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
