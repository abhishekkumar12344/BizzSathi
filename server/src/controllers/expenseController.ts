import { Response } from 'express';
import { db, ExpenseDoc } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getExpenses(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { category, startDate, endDate } = req.query;
    const data = db.getData();

    let expenses = data.expenses.filter((e) => e.businessId === businessId);

    if (category && typeof category === 'string') {
      expenses = expenses.filter((e) => e.category === category.toUpperCase());
    }

    if (startDate && typeof startDate === 'string') {
      expenses = expenses.filter((e) => e.date >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      expenses = expenses.filter((e) => e.date <= endDate);
    }

    expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

    return sendSuccess(res, {
      expenses,
      totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { category, description, amount, paymentMethod, date, receiptUrl } = req.body;

    const numAmount = Number(amount);
    if (!description || !numAmount || numAmount <= 0) {
      return sendError(res, 'Description and positive amount are required', 400);
    }

    const data = db.getData();
    const now = new Date().toISOString();

    const newExpense: ExpenseDoc = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId,
      category: category || 'OTHER',
      description: description.trim(),
      amount: Math.round(numAmount * 100) / 100,
      paymentMethod: paymentMethod || 'CASH',
      date: date || now.split('T')[0],
      receiptUrl: receiptUrl?.trim() || undefined,
      createdBy: req.user!.id,
      createdAt: now,
    };

    data.expenses.push(newExpense);
    db.save();

    return sendSuccess(res, newExpense, 'Expense recorded successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}

export async function deleteExpense(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { id } = req.params;
    const data = db.getData();

    const index = data.expenses.findIndex((e) => e.id === id && e.businessId === businessId);
    if (index === -1) {
      return sendError(res, 'Expense not found', 404);
    }

    data.expenses.splice(index, 1);
    db.save();

    return sendSuccess(res, null, 'Expense deleted successfully');
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
