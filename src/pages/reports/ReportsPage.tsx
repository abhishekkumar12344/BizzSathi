import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Download } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const ReportsPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/reports');
      if (res.success) {
        setReport(res.data);
      }
    } catch (err: any) {
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [business?.id]);

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt);
  };

  if (loading) {
    return (
      <div>
        <div style={{ height: '36px', width: '260px', marginBottom: '1.5rem' }} className="skeleton" />
        <div style={{ height: '300px' }} className="skeleton" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Financial Reports & Valuation</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Real-time profit & loss estimates, inventory capital lockup, and debtors aging
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchReports}>
          Refresh Report
        </button>
      </div>

      {/* P&L Breakdown Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--color-primary)" /> Profit & Loss Statement (Estimated)
          </h2>
          <span className="badge badge-success">Live Calculations</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#F8FAF8', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>1. TOTAL SALES REVENUE</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {formatCurrency(report?.totalRevenue)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>From {report?.salesCount} invoices</div>
          </div>

          <div style={{ background: '#F8FAF8', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>2. COST OF GOODS SOLD (COGS)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#69756B' }}>
              - {formatCurrency(report?.totalCogs)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Supplier purchase costs</div>
          </div>

          <div style={{ background: '#E8F5E9', padding: '1rem', borderRadius: '8px', border: '1px solid #C8E6C9' }}>
            <div style={{ fontSize: '0.75rem', color: '#2E7D32', fontWeight: 600 }}>3. ESTIMATED GROSS PROFIT</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16834A' }}>
              {formatCurrency(report?.grossProfit)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#2E7D32' }}>Revenue minus wholesale COGS</div>
          </div>

          <div style={{ background: '#FFF4E5', padding: '1rem', borderRadius: '8px', border: '1px solid #FFE0B2' }}>
            <div style={{ fontSize: '0.75rem', color: '#ED6C02', fontWeight: 600 }}>4. SHOP OVERHEAD EXPENSES</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#C62828' }}>
              - {formatCurrency(report?.totalExpenses)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ED6C02' }}>Rent, bills, helper wages</div>
          </div>
        </div>

        <div style={{ background: '#FAFCFA', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>
              NET ESTIMATED PROFIT
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              Gross Profit ({formatCurrency(report?.grossProfit)}) minus Shop Expenses ({formatCurrency(report?.totalExpenses)})
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: report?.netProfit >= 0 ? '#16834A' : '#C62828' }}>
            {formatCurrency(report?.netProfit)}
          </div>
        </div>
      </div>

      {/* Grid of Inventory Valuation & Debtors Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Inventory Capital Valuation */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={18} color="var(--color-primary)" /> Inventory Valuation
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Active Products in Catalogue:</span>
              <strong>{report?.inventoryValuation?.totalProducts} SKUs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Total Physical Units in Stock:</span>
              <strong>{report?.inventoryValuation?.totalStockUnits} units</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Capital Locked at Purchase Cost:</span>
              <strong style={{ color: '#0288D1' }}>{formatCurrency(report?.inventoryValuation?.costValue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-muted)' }}>Total Retail Realizable Value:</span>
              <strong style={{ color: 'var(--color-primary-dark)' }}>{formatCurrency(report?.inventoryValuation?.retailValue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>Potential Gross Inventory Margin:</span>
              <strong style={{ color: '#16834A', fontSize: '1.1rem' }}>
                {formatCurrency(report?.inventoryValuation?.potentialMargin)}
              </strong>
            </div>
          </div>
        </div>

        {/* Debtors Aging Summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#C62828" /> Receivables (Market Udhaar)
            </h2>
            <span className="badge badge-danger">
              Total: {formatCurrency(report?.receivables?.totalAmount)}
            </span>
          </div>

          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            Top debtors with outstanding balances:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {report?.receivables?.topDebtors && report.receivables.topDebtors.length > 0 ? (
              report.receivables.topDebtors.map((d: any) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: '#FDF7F7',
                    border: '1px solid #FFEBEE',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{d.phone}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#C62828', fontSize: '0.95rem' }}>
                    {formatCurrency(d.currentBalance)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                Great job! No pending receivables from any customers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
