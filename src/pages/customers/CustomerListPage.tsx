import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Phone,
  MapPin,
  Edit2,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const CustomerListPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [activeLedgerCustomer, setActiveLedgerCustomer] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    billingAddress: '',
    openingBalance: '0',
    notes: '',
  });

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load customer list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [business?.id]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      billingAddress: '',
      openingBalance: '0',
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      billingAddress: c.billingAddress || '',
      openingBalance: c.openingBalance.toString(),
      notes: c.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Customer name and phone number are required', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        const res: any = await api.patch(`/customers/${editingCustomer.id}`, formData);
        if (res.success) showToast('Customer updated', 'success');
      } else {
        const res: any = await api.post('/customers', formData);
        if (res.success) showToast('Customer added with Khata account', 'success');
      }
      setIsCustomerModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
  };

  const openCustomerLedger = async (customer: any) => {
    setActiveLedgerCustomer(customer);
    try {
      const res: any = await api.get(`/customers/${customer.id}/ledger`);
      if (res.success) {
        setLedgerData(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load ledger history', 'error');
    }
  };

  const handleCollectKhataPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLedgerCustomer || paymentAmount <= 0) return;

    try {
      const res: any = await api.post('/payments', {
        customerId: activeLedgerCustomer.id,
        amount: paymentAmount,
        paymentMethod,
        notes: paymentNotes || 'Khata settlement payment',
      });

      if (res.success) {
        showToast('Payment recorded and customer balance reduced!', 'success');
        setIsPaymentModalOpen(false);
        setPaymentAmount(0);
        setPaymentNotes('');
        // Refresh customer list & ledger
        fetchCustomers();
        openCustomerLedger(activeLedgerCustomer);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt);
  };

  const totalMarketUdhaar = customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customer Directory & Khata (Udhaar)</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Track contractor balances, billing ledgers, and receive partial payments
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> + Add Customer
        </button>
      </div>

      {/* Mini summary card */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#F9FBF9', borderLeft: '4px solid #C62828' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontWeight: 600 }}>
              TOTAL OUTSTANDING RECEIVABLES (ALL CUSTOMERS)
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalMarketUdhaar > 0 ? '#C62828' : '#16834A' }}>
              {formatCurrency(totalMarketUdhaar)}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', maxWidth: '380px' }}>
            Click <strong>"Khata Ledger"</strong> on any customer to inspect date-wise invoices, payments, and record settlement.
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search customer by name or mobile phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && fetchCustomers()}
          />
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--color-muted)' }} />
        </div>
      </div>

      {/* Customers Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone Number</th>
              <th>Billing Address</th>
              <th>Total Bills Raised</th>
              <th>Lifetime Spend</th>
              <th>Current Udhaar Balance</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td colSpan={7}><div style={{ height: '28px' }} className="skeleton" /></td>
                </tr>
              ))
            ) : customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.notes && <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{c.notes}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text)' }}>
                      <Phone size={13} color="var(--color-primary)" />
                      <span>{c.phone}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    {c.billingAddress || '-'}
                  </td>
                  <td>{c.totalBills || 0} bill(s)</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(c.lifetimeSpend)}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: c.currentBalance > 0 ? '#C62828' : '#16834A',
                      }}
                    >
                      {formatCurrency(c.currentBalance)}
                    </span>
                    {c.currentBalance > 0 && (
                      <span className="badge badge-danger" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                        DUE
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openCustomerLedger(c)}
                        title="View Ledger Statement"
                      >
                        <BookOpen size={14} /> Khata Ledger
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Customer"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  No customers found. Click "+ Add Customer" to register your first customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCustomerModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Vikram Construction Co (Er. Vikram)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98290 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="vikram.builds@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Site / Billing Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plot 42, Vaishali Nagar, Jaipur"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  />
                </div>

                {!editingCustomer && (
                  <div className="form-group">
                    <label className="form-label">Opening Udhaar Balance (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    />
                    <div className="form-help">Any historical balance carried over from old paper diary</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Internal Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Contractor for residential projects; clears on 5th"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCustomerModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Khata Ledger Statement Modal */}
      {activeLedgerCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  Khata Ledger: {activeLedgerCustomer.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                  Phone: {activeLedgerCustomer.phone}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setPaymentAmount(ledgerData?.currentBalance || 0);
                    setIsPaymentModalOpen(true);
                  }}
                >
                  + Record Payment
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveLedgerCustomer(null)}>
                  &times;
                </button>
              </div>
            </div>

            <div className="modal-body">
              {/* Balance Summary Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem', background: '#F8FAF8', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>TOTAL BILLED</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(ledgerData?.totalBilled)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>TOTAL PAID</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16834A' }}>{formatCurrency(ledgerData?.totalPaid)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>CURRENT BALANCE DUE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: ledgerData?.currentBalance > 0 ? '#C62828' : '#16834A' }}>
                    {formatCurrency(ledgerData?.currentBalance)}
                  </div>
                </div>
              </div>

              {/* Transactions Timeline Table */}
              <div className="data-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type / Particulars</th>
                      <th style={{ textAlign: 'right', color: '#C62828' }}>Debit (+)</th>
                      <th style={{ textAlign: 'right', color: '#16834A' }}>Credit (-)</th>
                      <th style={{ textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerData?.timeline && ledgerData.timeline.length > 0 ? (
                      ledgerData.timeline.map((entry: any) => (
                        <tr key={entry.id}>
                          <td>{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.description}</div>
                            {entry.reference && entry.reference !== '-' && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Ref: {entry.reference}</div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: entry.debit > 0 ? 600 : 400, color: entry.debit > 0 ? '#C62828' : 'inherit' }}>
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: entry.credit > 0 ? 600 : 400, color: entry.credit > 0 ? '#16834A' : 'inherit' }}>
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                          No transactions recorded in this ledger yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveLedgerCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Sub-Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment from Customer</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsPaymentModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCollectKhataPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Reference ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Settled via GPay by Er. Vikram"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
