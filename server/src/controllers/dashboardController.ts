import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../utils/response.js';

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const businessId = req.business!.id;
    const data = db.getData();

    const sales = data.sales.filter((s) => s.businessId === businessId && !s.isCancelled);
    const payments = data.payments.filter((p) => p.businessId === businessId);
    const expenses = data.expenses.filter((e) => e.businessId === businessId);
    const products = data.products.filter((p) => p.businessId === businessId && !p.isArchived);
    const customers = data.customers.filter((c) => c.businessId === businessId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Today's Sales
    const todaySales = sales.filter((s) => s.createdAt.startsWith(todayStr));
    const todaySalesRevenue = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

    // Month-to-date Sales
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const mtdSales = sales.filter((s) => s.createdAt.startsWith(currentMonthPrefix));
    const mtdSalesRevenue = mtdSales.reduce((acc, s) => acc + s.grandTotal, 0);

    // Total Amount Collected
    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    // Total Receivables (Udhaar) from customers
    const totalReceivables = customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0);

    // Total Expenses
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // Cost of goods sold (COGS) from sales
    let totalCogs = 0;
    sales.forEach((s) => {
      s.items.forEach((item) => {
        totalCogs += (item.purchaseCostSnapshot || 0) * item.quantity;
      });
    });

    const totalRevenueAllTime = sales.reduce((acc, s) => acc + s.grandTotal, 0);
    const grossProfitEstimate = totalRevenueAllTime - totalCogs;
    const netProfitEstimate = grossProfitEstimate - totalExpenses;

    // Low stock products
    const lowStockItems = products.filter((p) => p.currentStock <= p.minStockThreshold);

    // 7-Day sales trend
    const sevenDayTrend: { date: string; day: string; sales: number; bills: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const daySales = sales.filter((s) => s.createdAt.startsWith(dateKey));
      const dayTotal = daySales.reduce((acc, s) => acc + s.grandTotal, 0);

      sevenDayTrend.push({
        date: dateKey,
        day: dayName,
        sales: Math.round(dayTotal),
        bills: daySales.length,
      });
    }

    // Top selling products by quantity
    const productSalesCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (!productSalesCount[item.productId]) {
          productSalesCount[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesCount[item.productId].quantity += item.quantity;
        productSalesCount[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSalesCount)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent 5 sales
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return sendSuccess(res, {
      todaySalesRevenue: Math.round(todaySalesRevenue * 100) / 100,
      todaySalesCount: todaySales.length,
      mtdSalesRevenue: Math.round(mtdSalesRevenue * 100) / 100,
      totalSalesRevenue: Math.round(totalRevenueAllTime * 100) / 100,
      totalSalesCount: sales.length,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalReceivables: Math.round(totalReceivables * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      grossProfitEstimate: Math.round(grossProfitEstimate * 100) / 100,
      netProfitEstimate: Math.round(netProfitEstimate * 100) / 100,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      sevenDayTrend,
      topProducts,
      recentSales,
    });
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
}
