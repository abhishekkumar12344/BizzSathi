import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import './Auth.css';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    businessType: 'Retail & Hardware Store',
    address: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '',
    gstin: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      showToast('Please complete all personal details', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password should be at least 6 characters', 'error');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName) {
      showToast('Please enter your business or shop name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      showToast('Business setup successful! Welcome to BizSathi.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please check details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="brand-badge" style={{ display: 'inline-flex', padding: '0.4rem 0.6rem' }}>
            BS
          </div>
          <h1>Register Your Business</h1>
          <p>
            {step === 1 ? 'Step 1 of 2: Owner Account Details' : 'Step 2 of 2: Business & Billing Setup'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Ramesh Chandra"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+91 98290 00000"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="ramesh@mybusiness.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Next: Business Profile <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Business / Shop Name</label>
              <input
                type="text"
                name="businessName"
                className="form-input"
                placeholder="e.g. Ramesh Electricals & Sanitations"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select
                name="businessType"
                className="form-select"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="Retail & Hardware Store">Retail & Hardware Store</option>
                <option value="Electrical Supplies & Contracting">Electrical Supplies & Contracting</option>
                <option value="Mobile Accessories & Spares">Mobile Accessories & Spares</option>
                <option value="Kirana & General Store">Kirana & General Store</option>
                <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                <option value="Other Small Business">Other Small Business</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shop Address</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="e.g. Shop No. 12, Main Market Road"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  className="form-input"
                  placeholder="302001"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                className="form-input"
                placeholder="e.g. 08AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ flex: 2 }}
              >
                {isSubmitting ? 'Creating Business...' : 'Launch BizSathi'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          Already have a BizSathi account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
