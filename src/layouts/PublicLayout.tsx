import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="public-nav">
        <div className="container public-nav-inner">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-badge" style={{ padding: '0.4rem 0.6rem', fontSize: '1.1rem' }}>
              BS
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                BizSathi
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>
                Your Business. One Simple Platform.
              </div>
            </div>
          </Link>

          <nav className="public-nav-links">
            <Link to="/" className="public-nav-link">
              Home
            </Link>
            <a href="#features" className="public-nav-link">
              Features
            </a>
            <a href="#pricing" className="public-nav-link">
              Pricing
            </a>
            <a href="#faq" className="public-nav-link">
              FAQ
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard &rarr;
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register Business
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="brand-badge">BS</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>BizSathi</span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, maxWidth: '320px', color: '#97a89a' }}>
                Smart, high-speed business management SaaS engineered specifically for Indian retail shops,
                hardware merchants, electrical suppliers, and wholesale distributors.
              </p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Quick POS Billing</a></li>
                <li><a href="#features">Inventory & Stock Alerts</a></li>
                <li><a href="#features">Customer Khata Ledger</a></li>
                <li><a href="#pricing">Pricing Plans</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Target Industries</h4>
              <ul>
                <li>Electrical & Hardware Shops</li>
                <li>Mobile Spares & Accessories</li>
                <li>Kirana & Retail Stores</li>
                <li>Building Material Wholesalers</li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support & Security</h4>
              <ul>
                <li>Email: support@bizsathi.com</li>
                <li>Phone: +91 98290 00000</li>
                <li>Strict Tenant Isolation</li>
                <li>Made for Indian MSMEs</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>&copy; {new Date().getFullYear()} BizSathi Technologies Pvt. Ltd. All rights reserved.</div>
            <div>Built for Bharat &bull; Secure Cloud Infrastructure</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
