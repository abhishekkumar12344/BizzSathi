import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Calendar, Filter } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const ExpenseListPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'TEA_SNACKS',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/expenses${categoryFilter ? `?category=${categoryFilter}` : ''}`);
      if (res.success) {
        setExpenses(res.data.expenses);
        setTotalExpenseAmount(res.data.totalExpenseAmount);
      }
    } catch (err: any) {
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, business?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      showToast('Description and amount are required', 'error');
      return;
    }

    try {
      const res: any = await api.post('/expenses', formData);
      if (res.success) {
        showToast('Expense recorded', 'success');
        setIsModalOpen(false);
        setFormData({
          category: 'TEA_SNACKS',
          description: '',
          amount: '',
          paymentMethod: 'CASH',
          date: new Date().toISOString().split('T')[0],
        });
        fetchExpenses();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      const res: any = await api.delete(`/expenses/${id}`);
      if (res.success) {
        showToast('Expense deleted', 'success');
        fetchExpenses();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Shop Expenses & Overheads</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Record shop rent, commercial electricity, tea/nashta, and staff salaries
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> + Record Expense
        </button>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#F9FBF9', borderLeft: '4px solid var(--color-warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
              TOTAL RECORDED EXPENSES
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#202820' }}>
              {formatCurrency(totalExpenseAmount)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['', 'RENT', 'ELECTRICITY', 'SALARY', 'TEA_SNACKS', 'LOGISTICS', 'REPAIR'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === '' ? 'All' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Payment Mode</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={6}><div style={{ height: '28px' }} className="skeleton" /></td></tr>
              ))
            ) : expenses.length > 0 ? (
              expenses.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className="badge badge-neutral">{e.category.replace('_', ' ')}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{e.description}</td>
                  <td>{e.paymentMethod}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#C62828' }}>
                    {formatCurrency(e.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => handleDelete(e.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  No expenses recorded. Click "+ Record Expense" to log shop expenditures.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Record Shop Expense</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="TEA_SNACKS">Tea, Water & Snacks</option>
                    <option value="RENT">Shop Rent</option>
                    <option value="ELECTRICITY">Electricity Bill</option>
                    <option value="SALARY">Helper / Staff Salary</option>
                    <option value="LOGISTICS">Transport & Freight</option>
                    <option value="REPAIR">Shop Maintenance / Repair</option>
                    <option value="OTHER">Other Expense</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Daily customer tea and water jars"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="620"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      className="form-select"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
