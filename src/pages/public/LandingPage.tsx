import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Package,
  BookOpen,
  PieChart,
  ShieldCheck,
  Smartphone,
  Check,
  ArrowRight,
  TrendingUp,
  Receipt,
  Store,
} from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="container">
          <div className="hero-pill">
            <Zap size={14} color="var(--color-primary)" />
            <span>Built Specifically for Indian Small Businesses & Traders</span>
          </div>
          <h1 className="hero-title">
            Your Business.<br />
            <span style={{ color: 'var(--color-primary)' }}>One Simple Platform.</span>
          </h1>
          <p className="hero-subtitle">
            Say goodbye to slow billing registers, missing khata notebooks, and unrecorded stockouts.
            BizSathi brings fast counter billing, automated inventory alerts, customer udhaar ledgers,
            and real-time profit tracking into a clean, lightning-fast web platform.
          </p>
          <div className="hero-cta-group">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Free Today <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Live Demo Login
            </Link>
          </div>
          <div style={{ display: 'flex', gap: '2rem', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
            <div>&bull; Instant 10-second setup</div>
            <div>&bull; No credit card required</div>
            <div>&bull; Real-time multi-tenant cloud</div>
          </div>
        </div>
      </section>

      {/* Target Industries */}
      <section style={{ padding: '3rem 0', background: 'var(--color-white)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="badge badge-neutral">TRUSTED BY MSMEs</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Engineered For High-Speed Counter Operations
            </h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              'Electrical & Hardware Stores',
              'Mobile Spares & Accessories',
              'Kirana & Grocery Retailers',
              'Sanitary & Plumbing Supplies',
              'Paints & Building Materials',
              'Wholesale Distributors',
            ].map((ind) => (
              <div
                key={ind}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Store size={16} color="var(--color-primary)" />
                <span>{ind}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span className="badge badge-success">FEATURES</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.75rem 0 1rem' }}>
              Everything Your Shop Needs To Run Smoothly
            </h2>
            <p style={{ color: 'var(--color-muted)' }}>
              Built to replace chaotic manual paperwork with streamlined, error-free digital workflows.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Receipt size={24} />
              </div>
              <h3>Fast POS Billing Counter</h3>
              <p>
                Add items in 2 clicks with barcode or SKU search. Apply item-level discounts, configurable GST
                tax calculations, and print or download professional A4 or compact slips instantly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Package size={24} />
              </div>
              <h3>Inventory & Low-Stock Alerts</h3>
              <p>
                Every sale atomically deducts inventory and logs a traceable stock movement. Receive proactive
                warnings before fast-moving goods run out of stock.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BookOpen size={24} />
              </div>
              <h3>Customer Khata (Udhaar) Ledger</h3>
              <p>
                Track outstanding receivables per customer with complete running balances. Record partial
                payments across Cash, UPI, and Bank Transfer with zero reconciliation errors.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <h3>Daily Sales & Profit Analysis</h3>
              <p>
                View today's collected revenue, total udhaar owed by contractors, and realistic gross margins
                computed from real purchase cost snapshots.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} />
              </div>
              <h3>Strict Tenant Isolation</h3>
              <p>
                Your business records, inventory pricing, and customer debt lists are strictly isolated.
                No other business can ever view or access your private ledger data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Smartphone size={24} />
              </div>
              <h3>100% Mobile & Tablet Ready</h3>
              <p>
                Run your business on desktop counters during morning rush or check receivables and stock
                levels on your smartphone while visiting distributors or suppliers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '4rem 0', background: 'var(--color-white)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-info">SIMPLE 3-STEP SETUP</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
              How BizSathi Simplifies Your Day
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>01</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Register & Brand</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Enter your business name, address, and GSTIN. Get an automated invoice prefix and custom settings in seconds.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>02</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Add Products & Customers</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Enter items with selling prices, purchase costs, and minimum stock triggers. Add customer contacts and opening balances.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>03</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Bill Fast & Track Profit</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                Create bills with 2 clicks, accept Cash or UPI, maintain running customer ledgers, and view daily sales trends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <span className="badge badge-warning">TRANSPARENT PRICING</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0.75rem 0 1rem' }}>
              Affordable Plans For Every Stage
            </h2>
            <p style={{ color: 'var(--color-muted)' }}>
              No hidden costs or complicated accounting jargon. Choose the plan that fits your counter volume.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Free Forever</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Ideal for micro shops testing digital billing</p>
              <div className="pricing-price">₹0<span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}> / month</span></div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Up to 50 active products</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> 100 sales invoices/month</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Customer khata ledger</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Standard invoice printing</div>
              </div>
              <Link to="/register" className="btn btn-secondary" style={{ width: '100%' }}>
                Get Started
              </Link>
            </div>

            <div className="pricing-card popular">
              <div className="pricing-badge">MOST POPULAR</div>
              <h3>Dukan Starter</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>For growing retail counters & traders</p>
              <div className="pricing-price">₹499<span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}> / month</span></div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Unlimited products & categories</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Unlimited billing & invoices</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Low-stock automatic alerts</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Expense & profit tracking</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Thermal + A4 invoice layouts</div>
              </div>
              <Link to="/register" className="btn btn-primary" style={{ width: '100%' }}>
                Start 14-Day Free Trial
              </Link>
            </div>

            <div className="pricing-card">
              <h3>Vyapar Pro</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>For wholesalers & distributors</p>
              <div className="pricing-price">₹999<span style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}> / month</span></div>
              <div className="pricing-features-list">
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Everything in Dukan Starter</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Multi-staff roles (Owner, Manager, Staff)</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Supplier purchase history</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> CSV data export & valuation reports</div>
                <div className="pricing-feature-item"><Check size={16} color="var(--color-primary)" /> Priority phone & WhatsApp support</div>
              </div>
              <Link to="/register" className="btn btn-secondary" style={{ width: '100%' }}>
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '4rem 0', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="badge badge-neutral">FAQ</span>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.5rem' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="faq-item">
            <div className="faq-q">Can I use BizSathi on my mobile phone or tablet?</div>
            <div className="faq-a">
              Yes! BizSathi is fully responsive. You can use it on your shop desktop for fast counter billing, or on any Android/iOS smartphone to check stock and customer balances on the go.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-q">Can my staff create bills without seeing my purchase costs?</div>
            <div className="faq-a">
              Yes. Role-based permissions allow you to assign Staff roles that can add items and raise bills without viewing your wholesale supplier costs or net business profit.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-q">Can I print invoices on thermal receipt printers?</div>
            <div className="faq-a">
              Yes. Invoices support both standard A4 printing (with tax breakdown and bank details) and compact thermal formats suitable for 3-inch POS printers.
            </div>
          </div>

          <div className="faq-item">
            <div className="faq-q">Is my business data safe from other businesses?</div>
            <div className="faq-a">
              Absolutely. BizSathi enforces strict tenant-level isolation on every query. Your sales, products, and customer khata lists are completely isolated and private.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
