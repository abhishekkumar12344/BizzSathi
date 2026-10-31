# BizSathi — Phase 1: Architecture, Product Scope & Engineering Blueprint

**Project Name:** BizSathi  
**Brand Positioning:** *"Your Business. One Simple Platform."*  
**Target Market:** Indian Small Businesses (Retailers, Wholesalers, Distributors, Hardware/Electrical Shops, Mobile Stores)  
**Primary Tech Stack:** Node.js, Express.js, MongoDB (Mongoose), React (Vite), Pure CSS with CSS Variables, Recharts, Lucide React.

---

## 1. Product Requirements Document (PRD)

### 1.1 Executive Summary & Problem Statement
Small business owners (dukandars, traders, wholesalers) in India often manage their daily billing on paper 'kaccha parcha' or cumbersome, outdated desktop accounting software. This creates three critical friction points:
1. **Inventory Blindness:** Inability to track real-time stock levels across SKUs, leading to stockouts of fast-moving goods or dead stock.
2. **Khata (Receivables) Leakage:** Customer udhaar (credit) is tracked haphazardly in notebooks, causing delayed collections, unrecorded partial payments, and damaged customer relations.
3. **No Clear Financial Pulse:** Lack of daily/monthly visibility into actual revenue collected vs credit, expenses, and gross margins.

BizSathi solves this with an intuitive, mobile-responsive, tenant-isolated cloud SaaS offering speed-optimized POS/Billing, automated inventory movement tracking, customer udhaar khata ledger, expense management, and actionable business analytics.

### 1.2 Core Business Metrics & Principles
- **No Double Counting:** Sales revenue is distinct from cash collections; purchase cost is distinct from operational expenses.
- **Strict Tenant Isolation:** Every single business document (`Product`, `Customer`, `Sale`, `Payment`, `Expense`, etc.) strictly belongs to a single `businessId`. Cross-tenant data leaks are physically blocked at the query/middleware layer.
- **Decimal Safety:** All monetary calculations use integer paise (minor units, e.g. ₹100.50 = 10050) or precision-guaranteed rounding to eliminate floating-point representation bugs.
- **Immutable Financial Audit Trail:** Historical invoices and finalized payments cannot be mutated silently. Adjustments and refunds are stored as distinct ledger entries.

---

## 2. Target User Personas & Problem-Validation Questions

### Persona 1: Rajesh Sharma — Retail Hardware & Electrical Shop Owner
- **Location:** Tier-2 City (Jaipur, Rajasthan)
- **Scale:** 1 retail counter, 1 helper boy, ~800–1,500 active SKUs (wires, switches, pipes, tools).
- **Current Pain:** Counter gets crowded in evening peak hours. Typing slow software loses sales. Many contractor customers take supplies on credit ('udhaar') and settle at month-end.
- **Needs:** 3-click quick billing, barcode/SKU search, A4/compact thermal invoice printing, real-time customer outstanding balances.

### Persona 2: Anita Patel — Mobile Accessories & Repair Wholesaler
- **Location:** Ahmedabad, Gujarat
- **Scale:** Wholesaler dealing with 60+ retailers. Buys from Delhi/Mumbai distributors in bulk.
- **Current Pain:** Tracks receivables in Excel sheets that frequently get desynchronized. Staff makes mistakes in discounted line totals.
- **Needs:** Tiered pricing/discounts, supplier purchase history, downloadable PDF invoices with tax breakdown, role-based staff access so helpers cannot see wholesale supplier margins.

### Problem-Validation Questions for Real Pilot Users
1. *When a regular customer purchases 4 items on partial credit, how do you record it right now, and how long does it take?*
2. *How frequently do you encounter a situation where you believe you have stock on your shelf, but it is actually sold out?*
3. *What is your biggest roadblock during tax filing or monthly reconciliation—missing bills or unrecorded cash expenses?*
4. *Do your staff members have smartphones, and would you want them to raise bills from a tablet or phone without viewing your profit margins?*
5. *What invoice format do your customers prefer: a clean WhatsApp-ready PDF, an A4 printed copy, or a 3-inch thermal slip?*

---

## 3. Prioritized MVP Feature List (MoSCoW Matrix)

### Must-Have (MVP Launch Scope)
- **Multi-Tenant Auth & Onboarding:** Secure register/login, bcrypt password hashing, session/JWT handling, initial business profile setup (INR, Asia/Kolkata timezone).
- **Product & Inventory Engine:** Product catalogue (Name, SKU, Category, Selling Price, Purchase Cost, Stock, Min Threshold), stock movement logging, low-stock alerts.
- **Customer & Supplier Directory:** Customer contact cards, phone search, opening balances, supplier contact directory.
- **Sales & Billing Workflow:** Fast counter sale builder, walk-in customer support, item selector, tax and discount computation, server-side recalculation, transaction-safe invoice numbering.
- **Payment & Khata Ledger:** Record full/partial payments (Cash, UPI, Bank Transfer), real-time outstanding balance calculation, immutable payment history.
- **Business Dashboard:** Today's sales, month-to-date sales, collected cash/UPI, total outstanding receivables, low-stock alerts, 7-day sales trend chart.
- **Expense Tracker:** Log operational expenses by category, date, and payment mode.
- **Clean Responsive UI:** Pure CSS design system using BizSathi branding (#16834A primary, #F6F9F6 soft bg), sidebar navigation, mobile drawer.

### Should-Have (Phase 2 Follow-up)
- CSV product import/export with schema validation.
- Thermal compact print format alongside standard A4 PDF layout.
- Customer ledger statement download (PDF/Excel).
- Staff role invitations (Manager vs Staff with restricted margins view).
- In-app notification center for stockouts and overdue payments.

### Could-Have (Future Monetization & Scale)
- Automated payment reminder templates for WhatsApp/SMS.
- Multi-branch or multi-counter warehouse synchronization.
- Subscription billing integration (Razorpay/Cashfree) for Free vs Pro tiers.

### Won't-Have (Initial MVP Phase)
- External automated banking feed integration.
- Hardware-locked POS drivers.
- Public self-signup for Super Admin.

---

## 4. System Architecture & Request-Flow

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|  React 19 (Vite) + React Router DOM + Axios + Pure CSS + Recharts       |
|  - AuthContext (JWT/Cookie session + current user + current business)    |
|  - Toast Notification System                                            |
|  - Responsive Layout (Sidebar Desktop / Slide-over Mobile Drawer)       |
+------------------------------------+------------------------------------+
                                     |  HTTPS Requests (JSON / Auth Header)
                                     v
+-------------------------------------------------------------------------+
|                              SERVER TIER                                |
|  Node.js + Express.js API Gateway (Modular Service Architecture)        |
|  - Security Middleware: Helmet, CORS, Rate-Limiting, MongoSanitize      |
|  - Global Request ID & Structured Logging                               |
|  - Auth Middleware: Verify token, extract userId                        |
|  - Tenant Guard Middleware: Resolve business membership & enforce role  |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
               v                     v                     v
      [Controllers Layer]    [Services Layer]     [Validators Layer]
       - Parse & respond      - Domain logic       - Zod schema validation
                              - Atomic operations
                              - Decimal math
                                     |
                                     v
+-------------------------------------------------------------------------+
|                              DATA TIER                                  |
|  MongoDB (Mongoose ODM) with Compound Tenant Indexes                     |
|  - Isolated business collections                                        |
|  - StockMovement transaction atomicity                                  |
|  - Immutable audit logs & ledger entries                                |
+-------------------------------------------------------------------------+
```

### Request Flow for Sale Creation (`POST /api/sales`):
1. **Authentication:** `authMiddleware` validates user credentials.
2. **Tenant Guard:** Middleware retrieves the active `businessId` and checks that the user has an active `BusinessMembership` with appropriate permissions (`OWNER`, `MANAGER`, or `STAFF`).
3. **Payload Validation:** Zod validator checks line items, positive quantities, valid customer ID, discount constraints.
4. **Service Logic (Atomic):**
   - Server fetches active products from the database for that `businessId`.
   - Recalculates unit prices, discounts, taxes, and final totals server-side.
   - Verifies sufficient stock for non-negative inventory policy.
   - Generates unique sequential invoice number (e.g. `INV-2026-0001`).
   - Decrements stock and inserts `StockMovement` records.
   - If initial payment is made (e.g. ₹500 paid in Cash on ₹1,200 bill), inserts a `Payment` record and updates customer's ledger balance (+₹700 outstanding).
   - Writes the immutable `Sale` snapshot.
5. **Response:** 201 Created with full invoice payload and updated balances.

---

## 5. Database Entity Relationships (Schema Design)

- **User**: `_id`, `name`, `email`, `phone`, `passwordHash`, `role` (PLATFORM_ADMIN | USER), `isEmailVerified`, `status`, `createdAt`, `updatedAt`
- **Business**: `_id`, `name`, `businessType`, `email`, `phone`, `address`, `state`, `pincode`, `currency` (default "INR"), `timezone` (default "Asia/Kolkata"), `invoicePrefix` (default "INV"), `invoiceNextNumber`, `taxSettings`, `settings`, `createdAt`
- **BusinessMembership**: `_id`, `userId` -> User, `businessId` -> Business, `role` (OWNER | MANAGER | STAFF), `status` (ACTIVE | SUSPENDED), `createdAt`
- **Category**: `_id`, `businessId` -> Business, `name`, `description`, `isArchived`, `createdAt`
- **Product**: `_id`, `businessId` -> Business, `categoryId` -> Category, `name`, `sku`, `barcode`, `description`, `unit` (PCS, KG, BOX, MTR, etc.), `sellingPrice`, `purchaseCost`, `currentStock`, `minStockThreshold`, `supplierId` -> Supplier, `isArchived`, `createdAt`
- **StockMovement**: `_id`, `businessId` -> Business, `productId` -> Product, `type` (SALE | PURCHASE | ADJUSTMENT | RETURN), `quantity`, `balanceAfter`, `referenceId`, `notes`, `createdBy` -> User, `createdAt`
- **Customer**: `_id`, `businessId` -> Business, `name`, `phone`, `email`, `billingAddress`, `openingBalance`, `currentBalance` (Receivable), `notes`, `createdAt`
- **Supplier**: `_id`, `businessId` -> Business, `name`, `contactPerson`, `phone`, `email`, `address`, `notes`, `isArchived`, `createdAt`
- **Sale**: `_id`, `businessId` -> Business, `invoiceNumber`, `customerId` -> Customer (optional, or walk-in), `customerSnapshot`, `items` [{ `productId`, `name`, `sku`, `quantity`, `unit`, `unitPrice`, `purchaseCostSnapshot`, `discount`, `tax`, `total` }], `subtotal`, `totalDiscount`, `totalTax`, `grandTotal`, `paidAmount`, `balanceDue`, `paymentStatus` (PAID | PARTIAL | UNPAID), `notes`, `createdBy` -> User, `createdAt`
- **Payment**: `_id`, `businessId` -> Business, `saleId` -> Sale (optional, can be bulk ledger settlement), `customerId` -> Customer, `amount`, `paymentMethod` (CASH | UPI | BANK_TRANSFER | CARD), `referenceNumber`, `paymentDate`, `notes`, `createdBy` -> User, `createdAt`
- **Expense**: `_id`, `businessId` -> Business, `category` (RENT, ELECTRICITY, SALARY, LOGISTICS, TEA_SNACKS, REPAIR, OTHER), `description`, `amount`, `paymentMethod`, `date`, `receiptUrl`, `createdBy` -> User, `createdAt`
- **AuditLog**: `_id`, `businessId` -> Business, `userId` -> User, `action`, `entityType`, `entityId`, `details`, `ipAddress`, `createdAt`

---

## 6. Complete Initial Folder Structure

```
bizsathi/
├── .env.example
├── README.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── tenantGuard.js
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Business.js
│   │   │   ├── BusinessMembership.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── StockMovement.js
│   │   │   ├── Customer.js
│   │   │   ├── Supplier.js
│   │   │   ├── Sale.js
│   │   │   ├── Payment.js
│   │   │   ├── Expense.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── businessRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── supplierRoutes.js
│   │   │   ├── saleRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   │   ├── decimal.js
│   │   │   └── response.js
│   │   └── app.js
│   └── tests/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── saleService.js
│   │   ├── customerService.js
│   │   └── dashboardService.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx & Button.css
│   │   │   ├── Modal.jsx & Modal.css
│   │   │   ├── Toast.jsx & Toast.css
│   │   │   ├── Card.jsx & Card.css
│   │   │   ├── Skeleton.jsx & Skeleton.css
│   │   │   └── Badge.jsx & Badge.css
│   │   ├── forms/
│   │   │   ├── Input.jsx & Input.css
│   │   │   └── Select.jsx & Select.css
│   │   ├── tables/
│   │   │   ├── DataTable.jsx & DataTable.css
│   │   │   └── Pagination.jsx & Pagination.css
│   │   └── navigation/
│   │       ├── Sidebar.jsx & Sidebar.css
│   │       ├── Topbar.jsx & Topbar.css
│   │       └── MobileDrawer.jsx & MobileDrawer.css
│   ├── layouts/
│   │   ├── PublicLayout.jsx & PublicLayout.css
│   │   ├── DashboardLayout.jsx & DashboardLayout.css
│   │   └── AdminLayout.jsx & AdminLayout.css
│   ├── pages/
│   │   ├── public/
│   │   │   ├── LandingPage.jsx & LandingPage.css
│   │   │   ├── PricingPage.jsx & PricingPage.css
│   │   │   └── ContactPage.jsx & ContactPage.css
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx & LoginPage.css
│   │   │   ├── RegisterPage.jsx & RegisterPage.css
│   │   │   └── ForgotPasswordPage.jsx & ForgotPasswordPage.css
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx & DashboardPage.css
│   │   ├── products/
│   │   │   ├── ProductListPage.jsx & ProductListPage.css
│   │   │   └── ProductFormModal.jsx & ProductFormModal.css
│   │   ├── sales/
│   │   │   ├── SalesListPage.jsx & SalesListPage.css
│   │   │   ├── CreateSalePage.jsx & CreateSalePage.css
│   │   │   └── InvoiceModal.jsx & InvoiceModal.css
│   │   ├── customers/
│   │   │   ├── CustomerListPage.jsx & CustomerListPage.css
│   │   │   └── CustomerLedgerModal.jsx & CustomerLedgerModal.css
│   │   ├── expenses/
│   │   │   └── ExpenseListPage.jsx & ExpenseListPage.css
│   │   ├── reports/
│   │   │   └── ReportsPage.jsx & ReportsPage.css
│   │   └── settings/
│   │       └── BusinessSettingsPage.jsx & BusinessSettingsPage.css
│   └── styles/
│       ├── variables.css
│       └── reset.css
```

---

## 7. Environment & Dependency Plan

### Backend Dependencies:
- `express` (HTTP server & routing)
- `mongoose` (MongoDB schema modeling & compound indexing)
- `bcryptjs` (Password hashing)
- `jsonwebtoken` (Auth tokens)
- `cors`, `helmet` (Security headers and allowed origins)
- `express-rate-limit` (Brute-force protection on auth endpoints)
- `zod` (Input validation & schema contracts)
- `dotenv` (Environment configuration)

### Frontend Dependencies:
- `react`, `react-dom`
- `react-router-dom` (Client-side routing)
- `axios` (API client with interceptors for auth headers & session refresh)
- `lucide-react` (Crisp, modern SVG icons)
- `recharts` (Responsive charts for sales trends)

### Pure CSS Architecture:
- `variables.css`: Brand colors (`--color-primary: #16834A`, `--color-primary-dark: #105C36`, `--color-bg: #F6F9F6`, `--color-accent: #F4C542`, `--color-text: #202820`, `--color-muted: #69756B`, `--color-border: #E2E9E2`, `--color-error: #C62828`), typography scale, shadows, and radii.
- Zero Tailwind / Zero Bootstrap classes. Each component and page imports its own dedicated `.css` file.

---

## 8. Development Checklist (Divided into 2–3 Hour Sessions)

- **Session 1 (Phase 1):** Requirements validation, database schema specifications, folder structure, and dev plan alignment. *(Completed now)*
- **Session 2 (Phase 2):** Backend server foundation, database connectivity with health check, error handling middleware, Zod validator utility, and base response format.
- **Session 3 (Phase 3):** Authentication engine (register, login, JWT issuance), multi-tenant onboarding workflow (create user + business + owner membership), and tenant isolation middleware.
- **Session 4 (Phase 4):** Product catalogue and category management, atomic stock movements, low-stock threshold triggers, search, and category filtering.
- **Session 5 (Phase 5):** Customer khata & supplier directory, opening balances, ledger debit/credit calculations, and customer transaction history.
- **Session 6 (Phase 6):** Sales & billing POS interface, server-side line recalculation, atomic stock deduction, invoice numbering, printable/downloadable invoice generator.
- **Session 7 (Phase 7):** Payment recording (Cash/UPI/Bank), expense tracking, and real-time dashboard analytics with Recharts sales trends.
- **Session 8 (Phase 8):** In-app notification center, public marketing landing page, business profile settings, and super admin platform monitor.
- **Session 9 (Phase 9):** Mobile drawer responsiveness, keyboard shortcuts for fast POS billing, accessibility check, and edge-case validation.
- **Session 10 (Phase 10):** Integration tests, cross-tenant security verification, test runs, and final deployment readiness.

---

## 9. Acceptance Criteria & Testing Strategy for Each Phase

| Phase | Core Deliverable | Acceptance Criteria | Testing Method |
|---|---|---|---|
| **Phase 1** | Specs & Architecture | All requirements, schema models, and tenant safety rules defined. | Architecture review & plan approval. |
| **Phase 2** | Server & DB Foundation | `GET /api/health` returns 200 with DB status; centralized error handler sanitizes stack traces. | Automated API test + Curl check. |
| **Phase 3** | Auth & Multi-Tenancy | Registration atomically provisions user, business, and owner role. Tenant guard blocks non-members. | Auth unit tests + Cross-tenant penetration test. |
| **Phase 4** | Inventory & Stock | Products CRUD, SKU uniqueness per tenant, every quantity change logged in `StockMovement`. | Inventory validation & race-condition test. |
| **Phase 5** | Customers & Ledger | Adding credit sale increases receivable; payment reduces balance; immutable ledger trail. | Debit/credit ledger balance verification. |
| **Phase 6** | Billing & Invoicing | Sale atomically decreases stock, generates sequential invoice number, recomputes prices on server. | High-concurrency checkout test. |
| **Phase 7** | Dashboard & Analytics | Dashboard queries calculate today's revenue, udhaar receivables, and profit margins from real DB records. | Aggregation accuracy test against manual sums. |
| **Phase 8** | Admin & Landing Page | Landing page presents features, pricing, FAQs. Admin can inspect tenant health. | Responsive UI test & role-guard verification. |
| **Phase 9** | Mobile UX & Polish | Seamless operation on 360px mobile view up to 1440px desktop. Fast billing input flow. | Cross-device responsive viewport audit. |
| **Phase 10**| Security & Hardening | No plain-text secrets, strict CORS, rate-limiting on login, zero data leaks. | Security audit & automated test suite. |
