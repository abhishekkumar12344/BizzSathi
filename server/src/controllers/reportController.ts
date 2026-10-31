import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getReports(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const { type, startDate, endDate } = req.query;
    const data = db.getData();

    const sales = data.sales.filter((s) => s.businessId === businessId && !s.isCancelled);
    const expenses = data.expenses.filter((e) => e.businessId === businessId);
    const products = data.products.filter((p) => p.businessId === businessId && !p.isArchived);
    const customers = data.customers.filter((c) => c.businessId === businessId);

    // Filter by dates if passed
    const filteredSales = sales.filter((s) => {
      if (startDate && s.createdAt < (startDate as string)) return false;
      if (endDate && s.createdAt > (endDate as string) + 'T23:59:59.999Z') return false;
      return true;
    });

    const filteredExpenses = expenses.filter((e) => {
      if (startDate && e.date < (startDate as string)) return false;
      if (endDate && e.date > (endDate as string)) return false;
      return true;
    });

    // 1. Inventory Valuation
    let totalStockCount = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;

    products.forEach((p) => {
      totalStockCount += p.currentStock;
      inventoryCostValue += p.currentStock * p.purchaseCost;
      inventoryRetailValue += p.currentStock * p.sellingPrice;
    });

    const potentialGrossMargin = inventoryRetailValue - inventoryCostValue;

    // 2. Receivables Summary
    const debtors = customers
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance);
    const totalReceivables = debtors.reduce((acc, c) => acc + c.currentBalance, 0);

    // 3. Profit & Loss Summary
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
    let totalCogs = 0;
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        totalCogs += (item.purchaseCostSnapshot || 0) * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossProfit - totalExp;

    return sendSuccess(res, {
      salesCount: filteredSales.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCogs: Math.round(totalCogs * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalExpenses: Math.round(totalExp * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      inventoryValuation: {
        totalProducts: products.length,
        totalStockUnits: totalStockCount,
        costValue: Math.round(inventoryCostValue * 100) / 100,
        retailValue: Math.round(inventoryRetailValue * 100) / 100,
        potentialMargin: Math.round(potentialGrossMargin * 100) / 100,
      },
      receivables: {
        totalDebtors: debtors.length,
        totalAmount: Math.round(totalReceivables * 100) / 100,
        topDebtors: debtors.slice(0, 10),
      },
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
