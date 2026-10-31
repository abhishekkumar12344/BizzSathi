import React, { useState, useEffect } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const SupplierListPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/suppliers');
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [business?.id]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson || '',
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Supplier name and phone are required', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        const res: any = await api.patch(`/suppliers/${editingSupplier.id}`, formData);
        if (res.success) showToast('Supplier updated', 'success');
      } else {
        const res: any = await api.post('/suppliers', formData);
        if (res.success) showToast('Supplier added', 'success');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier', 'error');
    }
  };

  const handleDelete = async (s: any) => {
    if (!window.confirm(`Archive supplier "${s.name}"?`)) return;
    try {
      const res: any = await api.delete(`/suppliers/${s.id}`);
      if (res.success) {
        showToast('Supplier archived', 'success');
        fetchSuppliers();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to archive supplier', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Suppliers & Distributors</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Manage wholesale agencies, manufacturer distributors, and purchase contacts
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          <Plus size={16} /> + Add Supplier
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier / Agency Name</th>
              <th>Contact Person</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Warehouse / Address</th>
              <th>Products Linked</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}><td colSpan={7}><div style={{ height: '28px' }} className="skeleton" /></td></tr>
              ))
            ) : suppliers.length > 0 ? (
              suppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    {s.notes && <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{s.notes}</div>}
                  </td>
                  <td>{s.contactPerson || '-'}</td>
                  <td>{s.phone}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{s.email || '-'}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{s.address || '-'}</td>
                  <td>
                    <span className="badge badge-neutral">{s.productsSuppliedCount || 0} products</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(s)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(s)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  No suppliers registered. Click "+ Add Supplier" to record your first distributor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Agency / Supplier Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Havells Authorized Distributor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kailash Chand"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 94140 00000"
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
                    placeholder="supplier@agency.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address / Godown Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sansar Chandra Road, Jaipur"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSupplier ? 'Save Changes' : 'Create Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
