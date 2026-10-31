import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle,
  XCircle,
  Receipt,
  Download,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { InvoiceModal } from './InvoiceModal.js';
import './Sales.css';

export const SalesListPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paymentModalSale, setPaymentModalSale] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState('UPI');

  const fetchSales = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (statusFilter) query += `status=${statusFilter}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;

      const res: any = await api.get(`/sales${query}`);
      if (res.success) {
        setSales(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load sales list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter, business?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales();
  };

  const handleCancelSale = async (sale: any) => {
    if (!window.confirm(`Are you sure you want to cancel invoice #${sale.invoiceNumber}? All ${sale.items.length} items will be atomically returned to inventory and customer balance reversed.`)) {
      return;
    }

    try {
      const res: any = await api.post(`/sales/${sale.id}/cancel`, {
        reason: 'Cancelled by user from sales counter',
      });
      if (res.success) {
        showToast(`Invoice #${sale.invoiceNumber} cancelled and items returned to stock`, 'success');
        fetchSales();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel sale', 'error');
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalSale || collectAmount <= 0) return;

    try {
      const res: any = await api.post('/payments', {
        saleId: paymentModalSale.id,
        customerId: paymentModalSale.customerId,
        amount: collectAmount,
        paymentMethod: collectMethod,
        notes: `Settlement for invoice #${paymentModalSale.invoiceNumber}`,
      });

      if (res.success) {
        showToast('Payment recorded and invoice balance updated!', 'success');
        setPaymentModalSale(null);
        fetchSales();
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

  const totalBilled = sales.filter((s) => !s.isCancelled).reduce((acc, s) => acc + s.grandTotal, 0);
  const totalCollected = sales.filter((s) => !s.isCancelled).reduce((acc, s) => acc + s.paidAmount, 0);
  const totalBalanceDue = sales.filter((s) => !s.isCancelled).reduce((acc, s) => acc + s.balanceDue, 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Invoices & Billing History</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Search, print, reprint, collect pending payments, or cancel historical bills
          </p>
        </div>
        <Link to="/sales/new" className="btn btn-primary btn-sm">
          <PlusCircle size={16} /> + New Counter Bill
        </Link>
      </div>

      {/* Mini Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>TOTAL BILLED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            {formatCurrency(totalBilled)}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>TOTAL COLLECTED</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0288D1' }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>OUTSTANDING (UDHAAR)</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: totalBalanceDue > 0 ? '#C62828' : 'inherit' }}>
            {formatCurrency(totalBalanceDue)}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by invoice # or customer name/phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--color-muted)' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Status:</span>
            {['', 'PAID', 'PARTIAL', 'UNPAID'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === '' ? 'All' : st}
              </button>
            ))}
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Grand Total</th>
              <th>Paid</th>
              <th>Balance Due</th>
              <th>Payment Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={9}>
                    <div style={{ height: '28px' }} className="skeleton" />
                  </td>
                </tr>
              ))
            ) : sales.length > 0 ? (
              sales.map((s) => (
                <tr key={s.id} style={{ opacity: s.isCancelled ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 700, color: s.isCancelled ? '#999' : 'var(--color-primary-dark)' }}>
                      #{s.invoiceNumber}
                    </div>
                    {s.isCancelled && <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>CANCELLED</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.customerSnapshot?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      {s.customerSnapshot?.phone}
                    </div>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{s.items?.length || 0} line(s)</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.grandTotal)}</td>
                  <td style={{ color: '#16834A' }}>{formatCurrency(s.paidAmount)}</td>
                  <td style={{ fontWeight: 600, color: s.balanceDue > 0 ? '#C62828' : 'inherit' }}>
                    {formatCurrency(s.balanceDue)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.paymentStatus === 'PAID'
                          ? 'badge-success'
                          : s.paymentStatus === 'PARTIAL'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveInvoice(s)}
                        title="View / Print Invoice"
                      >
                        <Eye size={14} /> View Bill
                      </button>

                      {!s.isCancelled && s.balanceDue > 0 && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setPaymentModalSale(s);
                            setCollectAmount(s.balanceDue);
                          }}
                          title="Record customer payment"
                        >
                          Collect ₹{s.balanceDue}
                        </button>
                      )}

                      {!s.isCancelled && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelSale(s)}
                          title="Cancel invoice and restore stock"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  No sales found matching your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View / Print Invoice Modal */}
      {activeInvoice && (
        <InvoiceModal
          sale={activeInvoice}
          business={business}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* Collect Pending Payment Dialog */}
      {paymentModalSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setPaymentModalSale(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCollectPayment}>
              <div className="modal-body">
                <div style={{ background: '#f5f7f5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div><strong>Invoice:</strong> #{paymentModalSale.invoiceNumber}</div>
                  <div><strong>Customer:</strong> {paymentModalSale.customerSnapshot?.name}</div>
                  <div style={{ color: '#C62828', marginTop: '0.25rem' }}>
                    <strong>Balance Due:</strong> {formatCurrency(paymentModalSale.balanceDue)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={collectAmount}
                    max={paymentModalSale.balanceDue}
                    min={1}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value)}
                  >
                    <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CARD">Card</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalSale(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
