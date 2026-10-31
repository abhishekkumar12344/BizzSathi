import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import './DashboardLayout.css';

export const DashboardLayout: React.FC = () => {
  const { user, business, businesses, logout, switchBusiness } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Billing / POS', to: '/sales/new', icon: ShoppingCart, highlight: true },
    { label: 'Invoices & Sales', to: '/sales', icon: Receipt },
    { label: 'Products & Stock', to: '/products', icon: Package },
    { label: 'Categories', to: '/categories', icon: Layers },
    { label: 'Customers & Khata', to: '/customers', icon: Users },
    { label: 'Suppliers', to: '/suppliers', icon: Truck },
    { label: 'Expenses', to: '/expenses', icon: Wallet },
    { label: 'Reports & P&L', to: '/reports', icon: BarChart3 },
    { label: 'Business Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="dashboard-container">
      {/* Mobile Backdrop */}
      <div
        className={`mobile-drawer-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">BS</div>
          <div>
            <div className="brand-title">BizSathi</div>
            <div className="brand-tagline">Your Business. One Simple Platform.</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'text-primary' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                  POS
                </span>
              )}
            </NavLink>
          ))}

          {user?.role === 'PLATFORM_ADMIN' && (
            <>
              <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>
                Platform Control
              </div>
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ color: '#D4A017' }}
              >
                <ShieldAlert size={18} />
                <span>Super Admin Panel</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Business Switcher & Footer */}
        <div className="sidebar-footer">
          <div className="business-card-mini" style={{ position: 'relative' }}>
            <div className="business-avatar">{business?.name ? business.name[0] : 'B'}</div>
            <div
              className="business-info-mini"
              style={{ cursor: 'pointer', flex: 1 }}
              onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
            >
              <div className="business-name-mini" title={business?.name}>
                {business?.name || 'My Business'}
              </div>
              <div className="business-role-mini">
                Role: {business?.userRole || 'OWNER'} &bull; Switch <ChevronDown size={12} style={{ display: 'inline' }} />
              </div>
            </div>

            {bizDropdownOpen && businesses.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-muted)', padding: '0.25rem 0.5rem' }}>
                  YOUR BUSINESSES
                </div>
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      switchBusiness(b.id);
                      setBizDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      backgroundColor: b.id === business?.id ? 'var(--color-primary-light)' : 'transparent',
                      color: b.id === business?.id ? 'var(--color-primary-dark)' : 'inherit',
                      fontWeight: b.id === business?.id ? 600 : 400,
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--color-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{business?.name}</span>
              {business?.gstin && (
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                  GSTIN: {business.gstin}
                </span>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/sales/new')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} />
              <span>+ Quick Bill</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{user?.phone || user?.email}</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                title="Log Out"
                style={{ padding: '0.4rem' }}
              >
                <LogOut size={16} color="var(--color-muted)" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
