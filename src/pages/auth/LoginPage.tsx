import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import './Auth.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      showToast('Welcome back! Logged in successfully.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge" style={{ display: 'inline-flex', padding: '0.4rem 0.6rem' }}>
            BS
          </div>
          <h1>Welcome to BizSathi</h1>
          <p>Sign in to manage your bills, stock, and customer khata</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="rajesh@sharmaelectricals.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to Counter'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Register Your Dukan
          </Link>
        </div>

        {/* Quick Demo Credentials for Reviewers */}
        <div className="demo-credentials-box">
          <h4>
            <Zap size={14} /> Quick Demo Logins (Click to Autofill)
          </h4>
          <div className="demo-btn-grid">
            <button
              type="button"
              className="demo-chip"
              onClick={() => handleQuickDemo('rajesh@sharmaelectricals.in', 'Sharma@123')}
            >
              <div>
                <div className="demo-chip-name">1. Retail Owner: Rajesh Sharma</div>
                <div className="demo-chip-desc">Sharma Electricals & Hardware (Jaipur)</div>
              </div>
              <span className="badge badge-success">Click</span>
            </button>

            <button
              type="button"
              className="demo-chip"
              onClick={() => handleQuickDemo('anita@patelmobiles.com', 'Patel@123')}
            >
              <div>
                <div className="demo-chip-name">2. Wholesale Owner: Anita Patel</div>
                <div className="demo-chip-desc">Patel Mobile Spares (Ahmedabad)</div>
              </div>
              <span className="badge badge-info">Click</span>
            </button>

            <button
              type="button"
              className="demo-chip"
              onClick={() => handleQuickDemo('admin@bizsathi.com', 'Admin@123')}
            >
              <div>
                <div className="demo-chip-name">3. Platform Super Admin</div>
                <div className="demo-chip-desc">Full oversight & account moderation</div>
              </div>
              <span className="badge badge-warning">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
