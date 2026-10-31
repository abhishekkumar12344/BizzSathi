import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bizsathi_db.json');

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'PLATFORM_ADMIN' | 'USER';
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface BusinessDoc {
  id: string;
  name: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  status: 'ACTIVE' | 'SUSPENDED';
  suspensionReason?: string;
  taxRatePercent: number; // e.g. 18 for 18% GST
  taxEnabled: boolean;
  upiId?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMembershipDoc {
  id: string;
  userId: string;
  businessId: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface CategoryDoc {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface ProductDoc {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  unit: string; // PCS, MTR, BOX, KG, PKT
  sellingPrice: number; // in INR
  purchaseCost: number; // in INR
  currentStock: number;
  minStockThreshold: number;
  supplierId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementDoc {
  id: string;
  businessId: string;
  productId: string;
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number; // positive or negative
  balanceAfter: number;
  referenceId?: string; // e.g. sale invoice id
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerDoc {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  billingAddress?: string;
  openingBalance: number;
  currentBalance: number; // positive = customer owes business (Receivable)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDoc {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isArchived: boolean;
  createdAt: string;
}

export interface SaleItemDoc {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  purchaseCostSnapshot: number;
  discount: number;
  tax: number;
  total: number;
}

export interface SaleDoc {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId?: string;
  customerSnapshot: {
    name: string;
    phone: string;
    address?: string;
  };
  items: SaleItemDoc[];
  subtotal: number;
  totalDiscount: number;
  taxRatePercent: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT';
  notes?: string;
  isCancelled: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentDoc {
  id: string;
  businessId: string;
  saleId?: string;
  customerId: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD';
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpenseDoc {
  id: string;
  businessId: string;
  category: 'RENT' | 'ELECTRICITY' | 'SALARY' | 'LOGISTICS' | 'TEA_SNACKS' | 'REPAIR' | 'MARKETING' | 'OTHER';
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  date: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface SupportTicketDoc {
  id: string;
  businessId?: string;
  userId: string;
  subject: string;
  category: 'BILLING' | 'TECHNICAL' | 'FEATURE_REQUEST' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  description: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDoc {
  id: string;
  businessId?: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface DatabaseSchema {
  users: UserDoc[];
  businesses: BusinessDoc[];
  memberships: BusinessMembershipDoc[];
  categories: CategoryDoc[];
  products: ProductDoc[];
  stockMovements: StockMovementDoc[];
  customers: CustomerDoc[];
  suppliers: SupplierDoc[];
  sales: SaleDoc[];
  payments: PaymentDoc[];
  expenses: ExpenseDoc[];
  supportTickets: SupportTicketDoc[];
  auditLogs: AuditLogDoc[];
}

class DatabaseStore {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db file, re-initializing database:', err);
      }
    }
    const initial = this.seedInitialData();
    this.saveDatabaseSync(initial);
    return initial;
  }

  private saveDatabaseSync(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database:', err);
    } finally {
      this.isSaving = false;
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  private seedInitialData(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const ownerHash = bcrypt.hashSync('Sharma@123', salt);
    const patelHash = bcrypt.hashSync('Patel@123', salt);
    const now = new Date().toISOString();
    const todayYMD = now.split('T')[0];

    const users: UserDoc[] = [
      {
        id: 'usr_admin',
        name: 'BizSathi Platform Admin',
        email: 'admin@bizsathi.com',
        phone: '+91 98765 00000',
        passwordHash: adminHash,
        role: 'PLATFORM_ADMIN',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_rajesh',
        name: 'Rajesh Sharma',
        email: 'rajesh@sharmaelectricals.in',
        phone: '+91 98290 12345',
        passwordHash: ownerHash,
        role: 'USER',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'usr_anita',
        name: 'Anita Patel',
        email: 'anita@patelmobiles.com',
        phone: '+91 98980 54321',
        passwordHash: patelHash,
        role: 'USER',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const businesses: BusinessDoc[] = [
      {
        id: 'biz_sharma',
        name: 'Sharma Electricals & Hardware',
        businessType: 'Retail & Contracting Supplies',
        email: 'contact@sharmaelectricals.in',
        phone: '+91 98290 12345',
        address: 'Shop No. 14, M.I. Road, Near Panch Batti',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        gstin: '08AAAAA0000A1Z5',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        invoicePrefix: 'SEH',
        invoiceNextNumber: 105,
        status: 'ACTIVE',
        taxRatePercent: 18,
        taxEnabled: true,
        upiId: 'sharmaelectricals@okhdfcbank',
        bankDetails: {
          accountName: 'Sharma Electricals',
          accountNumber: '50200034129841',
          ifsc: 'HDFC0000123',
          bankName: 'HDFC Bank, M.I. Road Branch',
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'biz_patel',
        name: 'Patel Mobile Spares & Accessories',
        businessType: 'Wholesale & Distribution',
        email: 'wholesale@patelmobiles.com',
        phone: '+91 98980 54321',
        address: 'B-201, Relief Road Market',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        gstin: '24BBBBB1111B1Z9',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        invoicePrefix: 'PMA',
        invoiceNextNumber: 52,
        status: 'ACTIVE',
        taxRatePercent: 18,
        taxEnabled: true,
        upiId: 'patelmobiles@icici',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const memberships: BusinessMembershipDoc[] = [
      {
        id: 'mem_1',
        userId: 'usr_rajesh',
        businessId: 'biz_sharma',
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: now,
      },
      {
        id: 'mem_2',
        userId: 'usr_anita',
        businessId: 'biz_patel',
        role: 'OWNER',
        status: 'ACTIVE',
        createdAt: now,
      },
    ];

    const categories: CategoryDoc[] = [
      { id: 'cat_1', businessId: 'biz_sharma', name: 'Wires & Cables', description: 'FR & FRLS house wiring copper cables', isArchived: false, createdAt: now },
      { id: 'cat_2', businessId: 'biz_sharma', name: 'Modular Switches', description: 'Plates, switches, sockets, regulators', isArchived: false, createdAt: now },
      { id: 'cat_3', businessId: 'biz_sharma', name: 'LED Lights & Panels', description: 'Ceiling panels, bulbs, batten lights', isArchived: false, createdAt: now },
      { id: 'cat_4', businessId: 'biz_sharma', name: 'Pipes & Fittings', description: 'PVC conduit pipes, bends, junction boxes', isArchived: false, createdAt: now },
      { id: 'cat_5', businessId: 'biz_sharma', name: 'Tools & Fasteners', description: 'Screws, rawl plugs, pliers, testers', isArchived: false, createdAt: now },
      // Patel Mobile categories
      { id: 'cat_p1', businessId: 'biz_patel', name: 'Fast Chargers & Cables', description: 'Type-C, Lightning, GaN adapters', isArchived: false, createdAt: now },
      { id: 'cat_p2', businessId: 'biz_patel', name: 'Display & Touch Glass', description: 'OLED/LCD mobile folder assemblies', isArchived: false, createdAt: now },
    ];

    const suppliers: SupplierDoc[] = [
      {
        id: 'sup_1',
        businessId: 'biz_sharma',
        name: 'Polycab Authorized Distributor',
        contactPerson: 'Mahesh Agarwal',
        phone: '+91 94140 33221',
        email: 'sales@agrawalwires.com',
        address: 'Transport Nagar, Jaipur',
        isArchived: false,
        createdAt: now,
      },
      {
        id: 'sup_2',
        businessId: 'biz_sharma',
        name: 'Havells Electrical Agencies',
        contactPerson: 'Kailash Chand',
        phone: '+91 98280 44556',
        email: 'havells.jaipur@gmail.com',
        address: 'Sansar Chandra Road, Jaipur',
        isArchived: false,
        createdAt: now,
      },
    ];

    const products: ProductDoc[] = [
      {
        id: 'prd_1',
        businessId: 'biz_sharma',
        categoryId: 'cat_1',
        name: 'Polycab 1.5 sq mm FR Wire (90m, Red)',
        sku: 'PLY-15-RED',
        barcode: '89012345001',
        description: 'Single core multi-strand flame retardant PVC insulated wire',
        unit: 'BOX',
        sellingPrice: 1650,
        purchaseCost: 1350,
        currentStock: 24,
        minStockThreshold: 10,
        supplierId: 'sup_1',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd_2',
        businessId: 'biz_sharma',
        categoryId: 'cat_1',
        name: 'Polycab 2.5 sq mm FR Wire (90m, Yellow)',
        sku: 'PLY-25-YEL',
        barcode: '89012345002',
        description: 'Single core heavy-duty wire for AC and geyser points',
        unit: 'BOX',
        sellingPrice: 2450,
        purchaseCost: 2050,
        currentStock: 18,
        minStockThreshold: 8,
        supplierId: 'sup_1',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd_3',
        businessId: 'biz_sharma',
        categoryId: 'cat_2',
        name: 'Havells Coral 10A 1-Way Switch',
        sku: 'HVL-CRL-10A',
        barcode: '89012345003',
        description: 'Glossy white modular switch with silver contacts',
        unit: 'PCS',
        sellingPrice: 42,
        purchaseCost: 28,
        currentStock: 140,
        minStockThreshold: 50,
        supplierId: 'sup_2',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd_4',
        businessId: 'biz_sharma',
        categoryId: 'cat_2',
        name: 'Havells Coral 16A Power Socket',
        sku: 'HVL-CRL-16SKT',
        barcode: '89012345004',
        description: '3-pin shuttered modular power socket',
        unit: 'PCS',
        sellingPrice: 110,
        purchaseCost: 78,
        currentStock: 6, // Low stock on purpose for testing threshold alert!
        minStockThreshold: 15,
        supplierId: 'sup_2',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd_5',
        businessId: 'biz_sharma',
        categoryId: 'cat_3',
        name: 'Havells 18W Slim Round LED Panel (Warm White)',
        sku: 'HVL-LED-18W',
        barcode: '89012345005',
        description: 'Recessed aluminium ceiling light with surge protection',
        unit: 'PCS',
        sellingPrice: 480,
        purchaseCost: 340,
        currentStock: 35,
        minStockThreshold: 12,
        supplierId: 'sup_2',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prd_6',
        businessId: 'biz_sharma',
        categoryId: 'cat_4',
        name: 'Finolex 25mm Heavy PVC Conduit Pipe (3m)',
        sku: 'FNX-CND-25',
        barcode: '89012345006',
        description: 'Rigid fire-retardant electrical conduit pipe',
        unit: 'MTR',
        sellingPrice: 85,
        purchaseCost: 62,
        currentStock: 4, // Low stock on purpose!
        minStockThreshold: 20,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      // Patel Mobile Products
      {
        id: 'prd_p1',
        businessId: 'biz_patel',
        categoryId: 'cat_p1',
        name: '65W GaN Dual Type-C SuperFast Charger',
        sku: 'GAN-65W-BLK',
        unit: 'PCS',
        sellingPrice: 1299,
        purchaseCost: 750,
        currentStock: 80,
        minStockThreshold: 25,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const customers: CustomerDoc[] = [
      {
        id: 'cust_1',
        businessId: 'biz_sharma',
        name: 'Vikram Construction Co (Er. Vikram)',
        phone: '+91 98291 99887',
        email: 'vikram.builds@gmail.com',
        billingAddress: 'Plot 42, Vaishali Nagar, Jaipur',
        openingBalance: 0,
        currentBalance: 12500, // Outstanding balance (Udhaar)
        notes: 'Regular contractor for residential villas. Settle bills on 5th of each month.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cust_2',
        businessId: 'biz_sharma',
        name: 'Sunil Electrical Contractor',
        phone: '+91 94142 88776',
        billingAddress: 'Malviya Nagar Sector 3, Jaipur',
        openingBalance: 0,
        currentBalance: 3200,
        notes: 'Special discounts on bulk switch boxes.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cust_3',
        businessId: 'biz_sharma',
        name: 'Pooja Verma',
        phone: '+91 97850 11223',
        billingAddress: 'C-Scheme, Ashok Nagar, Jaipur',
        openingBalance: 0,
        currentBalance: 0, // Cleared
        notes: 'Home renovation retail customer',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sales: SaleDoc[] = [
      {
        id: 'sal_101',
        businessId: 'biz_sharma',
        invoiceNumber: 'SEH-101',
        customerId: 'cust_1',
        customerSnapshot: {
          name: 'Vikram Construction Co (Er. Vikram)',
          phone: '+91 98291 99887',
          address: 'Plot 42, Vaishali Nagar, Jaipur',
        },
        items: [
          {
            productId: 'prd_1',
            name: 'Polycab 1.5 sq mm FR Wire (90m, Red)',
            sku: 'PLY-15-RED',
            quantity: 5,
            unit: 'BOX',
            unitPrice: 1650,
            purchaseCostSnapshot: 1350,
            discount: 250,
            tax: 1440,
            total: 9440,
          },
          {
            productId: 'prd_3',
            name: 'Havells Coral 10A 1-Way Switch',
            sku: 'HVL-CRL-10A',
            quantity: 40,
            unit: 'PCS',
            unitPrice: 42,
            purchaseCostSnapshot: 28,
            discount: 80,
            tax: 288,
            total: 1888,
          },
        ],
        subtotal: 9930,
        totalDiscount: 330,
        taxRatePercent: 18,
        totalTax: 1728,
        grandTotal: 11328,
        paidAmount: 5000,
        balanceDue: 6328,
        paymentStatus: 'PARTIAL',
        paymentMethod: 'UPI',
        notes: 'Advance paid via PhonePe, balance due upon site finishing.',
        isCancelled: false,
        createdBy: 'usr_rajesh',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'sal_102',
        businessId: 'biz_sharma',
        invoiceNumber: 'SEH-102',
        customerId: 'cust_3',
        customerSnapshot: {
          name: 'Pooja Verma',
          phone: '+91 97850 11223',
          address: 'C-Scheme, Ashok Nagar, Jaipur',
        },
        items: [
          {
            productId: 'prd_5',
            name: 'Havells 18W Slim Round LED Panel (Warm White)',
            sku: 'HVL-LED-18W',
            quantity: 6,
            unit: 'PCS',
            unitPrice: 480,
            purchaseCostSnapshot: 340,
            discount: 0,
            tax: 518.4,
            total: 3398.4,
          },
        ],
        subtotal: 2880,
        totalDiscount: 0,
        taxRatePercent: 18,
        totalTax: 518.4,
        grandTotal: 3398.4,
        paidAmount: 3398.4,
        balanceDue: 0,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        notes: 'Full payment made at counter in cash.',
        isCancelled: false,
        createdBy: 'usr_rajesh',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        id: 'sal_103',
        businessId: 'biz_sharma',
        invoiceNumber: 'SEH-103',
        customerSnapshot: {
          name: 'Walk-in Retail Customer',
          phone: '+91 98000 00000',
        },
        items: [
          {
            productId: 'prd_3',
            name: 'Havells Coral 10A 1-Way Switch',
            sku: 'HVL-CRL-10A',
            quantity: 4,
            unit: 'PCS',
            unitPrice: 42,
            purchaseCostSnapshot: 28,
            discount: 0,
            tax: 30.24,
            total: 198.24,
          },
        ],
        subtotal: 168,
        totalDiscount: 0,
        taxRatePercent: 18,
        totalTax: 30.24,
        grandTotal: 198.24,
        paidAmount: 198.24,
        balanceDue: 0,
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        notes: 'Counter sale - paid via GPay',
        isCancelled: false,
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
    ];

    const payments: PaymentDoc[] = [
      {
        id: 'pay_1',
        businessId: 'biz_sharma',
        saleId: 'sal_101',
        customerId: 'cust_1',
        amount: 5000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/HDFC/2026/89431',
        paymentDate: todayYMD,
        notes: 'Advance for SEH-101',
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
      {
        id: 'pay_2',
        businessId: 'biz_sharma',
        saleId: 'sal_102',
        customerId: 'cust_3',
        amount: 3398.4,
        paymentMethod: 'CASH',
        paymentDate: todayYMD,
        notes: 'Counter payment',
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
    ];

    const expenses: ExpenseDoc[] = [
      {
        id: 'exp_1',
        businessId: 'biz_sharma',
        category: 'RENT',
        description: 'Shop rent for current month (Shop No. 14)',
        amount: 18000,
        paymentMethod: 'BANK_TRANSFER',
        date: todayYMD,
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
      {
        id: 'exp_2',
        businessId: 'biz_sharma',
        category: 'ELECTRICITY',
        description: 'JVVNL commercial electricity bill',
        amount: 2850,
        paymentMethod: 'UPI',
        date: todayYMD,
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
      {
        id: 'exp_3',
        businessId: 'biz_sharma',
        category: 'TEA_SNACKS',
        description: 'Customer tea, chai-nashta and drinking water cans',
        amount: 620,
        paymentMethod: 'CASH',
        date: todayYMD,
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
    ];

    const stockMovements: StockMovementDoc[] = [
      {
        id: 'sm_1',
        businessId: 'biz_sharma',
        productId: 'prd_1',
        type: 'SALE',
        quantity: -5,
        balanceAfter: 24,
        referenceId: 'sal_101',
        notes: 'Sale to Vikram Construction',
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
      {
        id: 'sm_2',
        businessId: 'biz_sharma',
        productId: 'prd_3',
        type: 'SALE',
        quantity: -40,
        balanceAfter: 140,
        referenceId: 'sal_101',
        notes: 'Sale to Vikram Construction',
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
      {
        id: 'sm_3',
        businessId: 'biz_sharma',
        productId: 'prd_5',
        type: 'SALE',
        quantity: -6,
        balanceAfter: 35,
        referenceId: 'sal_102',
        notes: 'Sale to Pooja Verma',
        createdBy: 'usr_rajesh',
        createdAt: now,
      },
    ];

    const supportTickets: SupportTicketDoc[] = [
      {
        id: 'tkt_1',
        businessId: 'biz_sharma',
        userId: 'usr_rajesh',
        subject: 'Need help customizing invoice header with second GSTIN',
        category: 'BILLING',
        priority: 'MEDIUM',
        status: 'OPEN',
        description: 'We have a warehouse in VKI area and want to include branch reference on invoices.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const auditLogs: AuditLogDoc[] = [
      {
        id: 'log_1',
        businessId: 'biz_sharma',
        userId: 'usr_rajesh',
        userName: 'Rajesh Sharma',
        action: 'BUSINESS_INITIALIZED',
        entityType: 'BUSINESS',
        entityId: 'biz_sharma',
        details: { message: 'Business created and onboarded successfully' },
        createdAt: now,
      },
    ];

    return {
      users,
      businesses,
      memberships,
      categories,
      products,
      stockMovements,
      customers,
      suppliers,
      sales,
      payments,
      expenses,
      supportTickets,
      auditLogs,
    };
  }
}

export const db = new DatabaseStore();
