import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { getBusiness, updateBusiness } from '../controllers/businessController.js';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import {
  getProducts,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} from '../controllers/productController.js';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerLedger,
} from '../controllers/customerController.js';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import {
  getSales,
  getSaleById,
  createSale,
  cancelSale,
} from '../controllers/saleController.js';
import { getPayments, createPayment } from '../controllers/paymentController.js';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController.js';
import { getReports } from '../controllers/reportController.js';
import {
  getAdminOverview,
  getAdminBusinesses,
  updateBusinessStatus,
  getAdminAuditLogs,
} from '../controllers/adminController.js';
import { getTickets, createTicket, replyTicket } from '../controllers/supportController.js';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth.js';
import { tenantGuard, requireRole } from '../middleware/tenantGuard.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'BizSathi SaaS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Authentication
apiRouter.post('/auth/register', register);
apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', authMiddleware, getMe);

// Business & Settings
apiRouter.get('/business', authMiddleware, tenantGuard, getBusiness);
apiRouter.patch('/business', authMiddleware, tenantGuard, requireRole(['OWNER']), updateBusiness);

// Dashboard
apiRouter.get('/dashboard/summary', authMiddleware, tenantGuard, getDashboardSummary);

// Products
apiRouter.get('/products', authMiddleware, tenantGuard, getProducts);
apiRouter.post('/products', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), createProduct);
apiRouter.patch('/products/:id', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), updateProduct);
apiRouter.post('/products/:id/adjust-stock', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), adjustStock);
apiRouter.delete('/products/:id', authMiddleware, tenantGuard, requireRole(['OWNER']), deleteProduct);

// Categories
apiRouter.get('/categories', authMiddleware, tenantGuard, getCategories);
apiRouter.post('/categories', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), createCategory);
apiRouter.patch('/categories/:id', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), updateCategory);
apiRouter.delete('/categories/:id', authMiddleware, tenantGuard, requireRole(['OWNER']), deleteCategory);

// Customers & Khata
apiRouter.get('/customers', authMiddleware, tenantGuard, getCustomers);
apiRouter.post('/customers', authMiddleware, tenantGuard, createCustomer);
apiRouter.patch('/customers/:id', authMiddleware, tenantGuard, updateCustomer);
apiRouter.get('/customers/:id/ledger', authMiddleware, tenantGuard, getCustomerLedger);

// Suppliers
apiRouter.get('/suppliers', authMiddleware, tenantGuard, getSuppliers);
apiRouter.post('/suppliers', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), createSupplier);
apiRouter.patch('/suppliers/:id', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), updateSupplier);
apiRouter.delete('/suppliers/:id', authMiddleware, tenantGuard, requireRole(['OWNER']), deleteSupplier);

// Sales & Billing
apiRouter.get('/sales', authMiddleware, tenantGuard, getSales);
apiRouter.get('/sales/:id', authMiddleware, tenantGuard, getSaleById);
apiRouter.post('/sales', authMiddleware, tenantGuard, createSale);
apiRouter.post('/sales/:id/cancel', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), cancelSale);

// Payments
apiRouter.get('/payments', authMiddleware, tenantGuard, getPayments);
apiRouter.post('/payments', authMiddleware, tenantGuard, createPayment);

// Expenses
apiRouter.get('/expenses', authMiddleware, tenantGuard, getExpenses);
apiRouter.post('/expenses', authMiddleware, tenantGuard, requireRole(['OWNER', 'MANAGER']), createExpense);
apiRouter.delete('/expenses/:id', authMiddleware, tenantGuard, requireRole(['OWNER']), deleteExpense);

// Reports
apiRouter.get('/reports', authMiddleware, tenantGuard, getReports);

// Support
apiRouter.get('/support/tickets', authMiddleware, getTickets);
apiRouter.post('/support/tickets', authMiddleware, createTicket);
apiRouter.patch('/support/tickets/:id/reply', authMiddleware, requireSuperAdmin, replyTicket);

// Super Admin
apiRouter.get('/admin/overview', authMiddleware, requireSuperAdmin, getAdminOverview);
apiRouter.get('/admin/businesses', authMiddleware, requireSuperAdmin, getAdminBusinesses);
apiRouter.patch('/admin/businesses/:id/status', authMiddleware, requireSuperAdmin, updateBusinessStatus);
apiRouter.get('/admin/audit-logs', authMiddleware, requireSuperAdmin, getAdminAuditLogs);
