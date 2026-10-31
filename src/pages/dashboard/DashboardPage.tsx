import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Users,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Package,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/dashboard/summary');
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [business?.id]);

  if (loading) {
    return (
      <div>
        <div style={{ height: '36px', width: '240px', marginBottom: '1.5rem' }} className="skeleton" />
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '110px' }} className="skeleton" />
          ))}
        </div>
        <div className="dashboard-charts-grid">
          <div style={{ height: '320px' }} className="skeleton" />
          <div style={{ height: '320px' }} className="skeleton" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Overview & Counter Pulse</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Live figures for {business?.name} &bull; Currency: INR (₹)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
            Refresh
          </button>
          <Link to="/sales/new" className="btn btn-primary btn-sm">
            <PlusCircle size={16} /> New Counter Bill
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner if any items triggered threshold */}
      {data?.lowStockCount > 0 && (
        <div className="alert-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#ED6C02" />
            <div>
              <strong>Low Inventory Alert:</strong> {data.lowStockCount} product(s) have fallen below their
              minimum reorder threshold.
            </div>
          </div>
          <Link to="/products?lowStock=true" className="btn btn-sm btn-secondary" style={{ color: '#8c4300' }}>
            View Low Stock Items &rarr;
          </Link>
        </div>
      )}

      {/* Top 4 Metric KPI Cards */}
      <div className="kpi-grid">
        {/* Today's Sales */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TODAY'S SALES</div>
            <div className="kpi-value text-primary">{formatCurrency(data?.todaySalesRevenue)}</div>
            <div className="kpi-sub">
              {data?.todaySalesCount} bill(s) generated today
            </div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#E8F5E9', color: '#16834A' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Collected Amount */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">TOTAL COLLECTED</div>
            <div className="kpi-value">{formatCurrency(data?.totalCollected)}</div>
            <div className="kpi-sub">Cash, UPI & Bank settlements</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#E1F5FE', color: '#0288D1' }}>
            <Receipt size={22} />
          </div>
        </div>

        {/* Outstanding Receivables (Udhaar) */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">OUTSTANDING UDHAAR</div>
            <div className="kpi-value" style={{ color: data?.totalReceivables > 0 ? '#C62828' : 'inherit' }}>
              {formatCurrency(data?.totalReceivables)}
            </div>
            <div className="kpi-sub">Due from contractor & credit buyers</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#FFEBEE', color: '#C62828' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Gross Profit Estimate */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">EST. GROSS PROFIT</div>
            <div className="kpi-value" style={{ color: '#16834A' }}>
              {formatCurrency(data?.grossProfitEstimate)}
            </div>
            <div className="kpi-sub">Sales revenue minus purchase cost</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#FFF4E5', color: '#ED6C02' }}>
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* Charts & Quick Lists */}
      <div className="dashboard-charts-grid">
        {/* 7-Day Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">7-Day Sales Velocity (₹)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Daily revenue trajectory</p>
            </div>
            <span className="badge badge-success">Daily</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.sevenDayTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16834A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16834A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E9E2" vertical={false} />
                <XAxis dataKey="day" stroke="#69756B" fontSize={12} tickLine={false} />
                <YAxis stroke="#69756B" fontSize={12} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Sales Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E9E2' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#16834A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Top Selling Items</h2>
            <Link to="/products" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              All &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data?.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((p: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.65rem',
                    borderBottom: idx === data.topProducts.length - 1 ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      Sold: {p.quantity} units
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem' }}>
                    {formatCurrency(p.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                No sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Invoices Generated</h2>
          <Link to="/sales" className="btn btn-secondary btn-sm">
            View All Sales &rarr;
          </Link>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Grand Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSales && data.recentSales.length > 0 ? (
                data.recentSales.map((s: any) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                      #{s.invoiceNumber}
                    </td>
                    <td>
                      <div>{s.customerSnapshot?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                        {s.customerSnapshot?.phone}
                      </div>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.grandTotal)}</td>
                    <td>{formatCurrency(s.paidAmount)}</td>
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
                    <td>
                      <Link to={`/sales`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                    No bills generated yet. Click "+ Quick Bill" to raise your first sale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
