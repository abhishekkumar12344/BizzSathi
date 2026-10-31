import React, { useState, useEffect } from 'react';
import { ShieldAlert, Building2, CheckCircle, Ban, AlertTriangle, FileText } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [overview, setOverview] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Suspension modal
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'ACTIVATE'>('SUSPEND');
  const [actionReason, setActionReason] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overRes, bizRes, logRes]: any = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/businesses'),
        api.get('/admin/audit-logs'),
      ]);

      if (overRes.success) setOverview(overRes.data);
      if (bizRes.success) setBusinesses(bizRes.data);
      if (logRes.success) setAuditLogs(logRes.data);
    } catch (err: any) {
      showToast('Failed to load platform admin metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      const newStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
      const res: any = await api.patch(`/admin/businesses/${selectedBusiness.id}/status`, {
        status: newStatus,
        reason: actionReason,
      });

      if (res.success) {
        showToast(res.message || 'Status updated', 'success');
        setSelectedBusiness(null);
        setActionReason('');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update business status', 'error');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Super Admin Platform Oversight</h1>
            <span className="badge badge-warning">PLATFORM ADMIN</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Monitor tenant health, enforce account compliance, and inspect audit activity
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchAdminData}>
          Refresh Platform Metrics
        </button>
      </div>

      {/* Platform Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>TOTAL ONBOARDED BUSINESSES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
            {overview?.totalBusinesses || 0}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)' }}>
            {overview?.activeBusinesses} active &bull; {overview?.suspendedBusinesses} suspended
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>TOTAL REGISTERED USERS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{overview?.totalUsers || 0}</div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)' }}>Owners, managers & staff</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>TOTAL INVOICES GENERATED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0288D1' }}>
            {overview?.totalSalesAll || 0}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)' }}>Across all business accounts</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>PLATFORM GMV PROCESSED</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16834A' }}>
            {formatCurrency(overview?.totalVolumeAll)}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--color-muted)' }}>All-time platform turnover</div>
        </div>
      </div>

      {/* Business Accounts Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">Tenant Business Accounts</h2>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business Name & City</th>
                <th>Owner Contact</th>
                <th>Catalogue SKUs</th>
                <th>Total Invoices</th>
                <th>Total Volume (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length > 0 ? (
                businesses.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                        {b.city}, {b.state} &bull; {b.businessType}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.ownerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{b.ownerEmail}</div>
                    </td>
                    <td>{b.totalProductsCount || 0} items</td>
                    <td>{b.totalSalesCount || 0} bills</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(b.totalRevenue)}</td>
                    <td>
                      <span
                        className={`badge ${b.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {b.status === 'ACTIVE' ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setSelectedBusiness(b);
                            setActionType('SUSPEND');
                            setActionReason('');
                          }}
                        >
                          <Ban size={14} /> Suspend
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedBusiness(b);
                            setActionType('ACTIVATE');
                            setActionReason('Re-activated by Platform Admin');
                          }}
                        >
                          <CheckCircle size={14} /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                    No businesses loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Platform Audit Trail (Recent Actions)</h2>
        </div>
        <div className="data-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td><strong>{log.userName}</strong></td>
                  <td><span className="badge badge-neutral">{log.action}</span></td>
                  <td style={{ fontSize: '0.75rem' }}>{log.entityId}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Confirmation Modal */}
      {selectedBusiness && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {actionType === 'SUSPEND' ? 'Suspend Business Account' : 'Reactivate Business Account'}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBusiness(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Target Business: <strong>{selectedBusiness.name}</strong> ({selectedBusiness.ownerEmail})
                </div>

                {actionType === 'SUSPEND' ? (
                  <div className="form-group">
                    <label className="form-label">Reason for Account Suspension *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Terms violation or unpaid subscription"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      required
                    />
                    <div className="form-help" style={{ color: '#C62828' }}>
                      Once suspended, members of this business will be prevented from generating new bills or accessing data.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    Are you sure you want to lift the suspension for this business? All permissions will be restored immediately.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedBusiness(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={actionType === 'SUSPEND' ? 'btn btn-danger' : 'btn btn-primary'}
                >
                  Confirm {actionType === 'SUSPEND' ? 'Suspension' : 'Reactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
