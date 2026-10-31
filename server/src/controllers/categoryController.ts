import { Response } from 'express';
import { db, CategoryDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const data = db.getData();

    const categories = data.categories.filter((c) => c.businessId === businessId && !c.isArchived);

    // Count products per category
    const enriched = categories.map((c) => {
      const productCount = data.products.filter(
        (p) => p.businessId === businessId && p.categoryId === c.id && !p.isArchived
      ).length;
      return {
        ...c,
        productCount,
      };
    });

    return sendSuccess(res, enriched);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Category name is required', 400);
    }

    const data = db.getData();
    const existing = data.categories.find(
      (c) => c.businessId === businessId && !c.isArchived && c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      return sendError(res, `A category named "${name.trim()}" already exists.`, 409);
    }

    const newCategory: CategoryDoc = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      name: name.trim(),
      description: description?.trim() || '',
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    data.categories.push(newCategory);
    db.save();

    return sendSuccess(res, newCategory, 'Category created successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const { name, description } = req.body;

    const data = db.getData();
    const category = data.categories.find((c) => c.id === id && c.businessId === businessId);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;

    db.save();
    return sendSuccess(res, category, 'Category updated successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const category = data.categories.find((c) => c.id === id && c.businessId === businessId);
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    // Check if any active products are linked to this category
    const activeProducts = data.products.filter(
      (p) => p.businessId === businessId && p.categoryId === id && !p.isArchived
    );

    if (activeProducts.length > 0) {
      return sendError(
        res,
        `Cannot delete category. There are ${activeProducts.length} active products assigned to it. Reassign or delete those products first.`,
        400
      );
    }

    category.isArchived = true;
    db.save();
    return sendSuccess(res, null, 'Category archived successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
