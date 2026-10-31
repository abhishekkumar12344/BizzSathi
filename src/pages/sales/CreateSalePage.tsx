import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  User,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { InvoiceModal } from './InvoiceModal.js';
import './Sales.css';

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  availableStock: number;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
}

export const CreateSalePage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Products catalogue & customer lists
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkInName, setWalkInName] = useState<string>('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [applyTax, setApplyTax] = useState<boolean>(business?.taxEnabled ?? true);
  const [taxRate, setTaxRate] = useState<number>(business?.taxRatePercent ?? 18);
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSale, setCreatedSale] = useState<any>(null);

  // Load products and customers
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [prodRes, custRes]: any = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
        ]);
        if (prodRes.success) setProducts(prodRes.data);
        if (custRes.success) setCustomers(custRes.data);
      } catch (err: any) {
        showToast('Failed to load inventory for billing', 'error');
      }
    };
    loadInitial();
  }, []);

  // Filter products live as user types in search bar
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 8);
    setSearchResults(matches);
  }, [searchQuery, products]);

  // Add product to cart
  const addToCart = (product: any) => {
    if (product.currentStock <= 0) {
      showToast(`Cannot add "${product.name}": Out of stock!`, 'error');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          showToast(`Cannot add more: only ${product.currentStock} units in stock`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            availableStock: product.currentStock,
            unitPrice: product.sellingPrice,
            quantity: 1,
            discount: 0,
            lineTotal: product.sellingPrice,
          },
        ];
      }
    });

    setSearchQuery('');
    setSearchResults([]);
  };

  // Update item quantity
  const updateQuantity = (productId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const finalQty = Math.max(1, Math.min(item.availableStock, qty));
          return {
            ...item,
            quantity: finalQty,
            lineTotal: Math.max(0, finalQty * item.unitPrice - item.discount),
          };
        }
        return item;
      })
    );
  };

  // Update item discount
  const updateDiscount = (productId: string, disc: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const safeDisc = Math.max(0, disc);
          return {
            ...item,
            discount: safeDisc,
            lineTotal: Math.max(0, item.quantity * item.unitPrice - safeDisc),
          };
        }
        return item;
      })
    );
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const totalItemDiscounts = cartItems.reduce((acc, item) => acc + item.discount, 0);
  const taxableAmount = Math.max(0, subtotal - totalItemDiscounts);
  const taxAmount = applyTax ? Math.round((taxableAmount * (taxRate / 100)) * 100) / 100 : 0;
  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Selected customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Auto-set paid amount when grand total changes if not manually set to partial
  useEffect(() => {
    if (paidAmount === '' || paidAmount === 0 || paymentMethod === 'CREDIT') {
      if (paymentMethod === 'CREDIT') {
        setPaidAmount(0);
      } else {
        setPaidAmount(grandTotal);
      }
    }
  }, [grandTotal, paymentMethod]);

  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      showToast('Please add at least one product to generate a bill', 'error');
      return;
    }

    const payload = {
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomerId ? undefined : walkInName,
      customerPhone: selectedCustomerId ? undefined : walkInPhone,
      items: cartItems.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        discount: it.discount,
      })),
      taxRatePercent: applyTax ? taxRate : 0,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      notes,
    };

    setIsSubmitting(true);
    try {
      const res: any = await api.post('/sales', payload);
      if (res.success && res.data) {
        setCreatedSale(res.data);
        showToast(`Invoice #${res.data.invoiceNumber} created!`, 'success');
        // Clear cart for next sale
        setCartItems([]);
      }
    } catch (err: any) {
      showToast(err.message || 'Error generating invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Counter Billing / POS</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            High-speed billing with instant inventory deduction and customer khata sync
          </p>
        </div>
      </div>

      <div className="pos-container">
        {/* Left: Product Selector & Cart Items Table */}
        <div className="pos-left">
          {/* Live Product Search */}
          <div className="pos-search-bar" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search products by SKU, item name or barcode (e.g. wire, switch, 1.5, HVL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Search
                size={18}
                style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--color-muted)' }}
              />

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 200,
                    marginTop: '4px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      style={{
                        padding: '0.65rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F6F2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)' }}>
                          SKU: {p.sku} &bull; Stock: {p.currentStock} {p.unit}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                          {formatCurrency(p.sellingPrice)}
                        </div>
                        <span
                          className={`badge ${
                            p.currentStock <= p.minStockThreshold ? 'badge-warning' : 'badge-neutral'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {p.currentStock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Table */}
          <div className="pos-items-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th style={{ width: '100px' }}>Rate (₹)</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '90px' }}>Disc (₹)</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <tr key={item.productId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                          SKU: {item.sku} &bull; Stock: {item.availableStock} {item.unit}
                        </div>
                      </td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem' }}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="form-input"
                            style={{ width: '50px', textAlign: 'center', padding: '0.2rem' }}
                            value={item.quantity}
                            min={1}
                            max={item.availableStock}
                            onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                          />
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem' }}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: '70px', padding: '0.25rem 0.5rem' }}
                          value={item.discount}
                          min={0}
                          onChange={(e) => updateDiscount(item.productId, Number(e.target.value))}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(item.lineTotal)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          style={{ color: 'var(--color-error)' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-muted)' }}>
                      <Receipt size={36} color="var(--color-border-dark)" style={{ margin: '0 auto 0.75rem' }} />
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>
                        No items added to the bill yet
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Search an item above or click on quick inventory list to start billing.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Customer & Checkout Calculations */}
        <div className="pos-right">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--color-primary)" /> Customer & Payment
          </h2>

          {/* Customer Selection */}
          <div className="form-group">
            <label className="form-label">Select Customer / Khata</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Walk-in Retail Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - Udhaar: ₹{c.currentBalance}
                </option>
              ))}
            </select>
          </div>

          {!selectedCustomerId ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Walk-in Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91..."
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#F9FBF9',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Existing Udhaar Balance:</span>
                <strong style={{ color: selectedCustomer?.currentBalance > 0 ? '#C62828' : '#16834A' }}>
                  ₹{selectedCustomer?.currentBalance || 0}
                </strong>
              </div>
              {selectedCustomer?.billingAddress && (
                <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                  {selectedCustomer.billingAddress}
                </div>
              )}
            </div>
          )}

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Cash (Counter)</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
              <option value="CARD">Card (Debit / Credit)</option>
              <option value="CREDIT">Full Credit (100% Udhaar)</option>
            </select>
          </div>

          {/* Tax Setting */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
              />
              <span>Apply GST Tax ({taxRate}%)</span>
            </label>
          </div>

          {/* Bill Summary Calculations */}
          <div style={{ background: '#fafcfa', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
            <div className="pos-summary-row">
              <span>Subtotal ({cartItems.reduce((acc, it) => acc + it.quantity, 0)} items):</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalItemDiscounts > 0 && (
              <div className="pos-summary-row" style={{ color: '#C62828' }}>
                <span>Discounts:</span>
                <span>- {formatCurrency(totalItemDiscounts)}</span>
              </div>
            )}
            {applyTax && (
              <div className="pos-summary-row">
                <span>GST Tax ({taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="pos-summary-row total">
              <span>Grand Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="form-group">
            <label className="form-label">Amount Paid Right Now (₹)</label>
            <input
              type="number"
              className="form-input"
              value={paidAmount}
              min={0}
              max={grandTotal}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
            />
            {Number(paidAmount) < grandTotal && (
              <div className="form-help" style={{ color: '#C62828', fontWeight: 600 }}>
                Remaining {formatCurrency(grandTotal - (Number(paidAmount) || 0))} will be added to customer Udhaar balance.
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            className="btn btn-primary btn-lg"
            disabled={cartItems.length === 0 || isSubmitting}
            onClick={handleGenerateBill}
            style={{ width: '100%', marginTop: 'auto' }}
          >
            {isSubmitting ? 'Processing Bill...' : 'Generate Invoice & Print'}
          </button>
        </div>
      </div>

      {/* Invoice Modal for Printable Receipt */}
      {createdSale && (
        <InvoiceModal
          sale={createdSale}
          business={business}
          onClose={() => setCreatedSale(null)}
        />
      )}
    </div>
  );
};
