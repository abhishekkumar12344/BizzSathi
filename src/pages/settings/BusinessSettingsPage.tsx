import React, { useState, useEffect } from 'react';
import { Settings, Building2, CreditCard, Percent, Save, Check } from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const BusinessSettingsPage: React.FC = () => {
  const { business, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    invoicePrefix: 'INV',
    taxRatePercent: 18,
    taxEnabled: true,
    upiId: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        businessType: business.businessType || '',
        phone: business.phone || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || 'Rajasthan',
        pincode: business.pincode || '',
        gstin: business.gstin || '',
        invoicePrefix: business.invoicePrefix || 'INV',
        taxRatePercent: business.taxRatePercent ?? 18,
        taxEnabled: business.taxEnabled ?? true,
        upiId: business.upiId || '',
        bankAccountName: (business as any).bankDetails?.accountName || '',
        bankAccountNumber: (business as any).bankDetails?.accountNumber || '',
        bankIfsc: (business as any).bankDetails?.ifsc || '',
        bankName: (business as any).bankDetails?.bankName || '',
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as any).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        businessType: formData.businessType,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gstin: formData.gstin,
        invoicePrefix: formData.invoicePrefix,
        taxRatePercent: Number(formData.taxRatePercent),
        taxEnabled: Boolean(formData.taxEnabled),
        upiId: formData.upiId,
        bankDetails: {
          accountName: formData.bankAccountName,
          accountNumber: formData.bankAccountNumber,
          ifsc: formData.bankIfsc,
          bankName: formData.bankName,
        },
      };

      const res: any = await api.patch('/business', payload);
      if (res.success) {
        showToast('Business profile and invoice settings updated!', 'success');
        refreshProfile();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Business Profile & Billing Configuration</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          Manage your shop address, tax rates, invoice prefixes, and UPI QR payment handles
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Business Details Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="var(--color-primary)" /> Store Profile & Location
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Shop / Business Name *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <input
                type="text"
                name="businessType"
                className="form-input"
                value={formData.businessType}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">GSTIN (Goods and Services Tax ID)</label>
              <input
                type="text"
                name="gstin"
                className="form-input"
                placeholder="e.g. 08AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shop Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                name="pincode"
                className="form-input"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Invoice & Tax Settings */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Percent size={20} color="var(--color-primary)" /> Invoicing & Tax Preferences
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                className="form-input"
                placeholder="e.g. INV, SEH, DUKAN"
                value={formData.invoicePrefix}
                onChange={handleChange}
                required
              />
              <div className="form-help">
                Next generated bill will be: <strong>{formData.invoicePrefix}-{business?.invoiceNextNumber || 101}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Default GST Tax Rate (%)</label>
              <input
                type="number"
                name="taxRatePercent"
                className="form-input"
                value={formData.taxRatePercent}
                onChange={handleChange}
              />
              <div className="form-help">Typical rates: 18%, 12%, 5%, or 0% for exempt items</div>
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="taxEnabled"
                checked={formData.taxEnabled}
                onChange={handleChange}
              />
              <span style={{ fontWeight: 500 }}>Enable Tax breakdown on invoices by default</span>
            </label>
          </div>
        </div>

        {/* Payment QR & Banking */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} color="var(--color-primary)" /> UPI QR & Bank Settlement Details
            </h2>
          </div>

          <div className="form-group">
            <label className="form-label">Shop UPI VPA (Virtual Payment Address)</label>
            <input
              type="text"
              name="upiId"
              className="form-input"
              placeholder="e.g. mydukan@okhdfcbank or 9829000000@paytm"
              value={formData.upiId}
              onChange={handleChange}
            />
            <div className="form-help">Printed on invoices for customer scan & pay</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                name="bankName"
                className="form-input"
                placeholder="e.g. HDFC Bank, M.I. Road Branch"
                value={formData.bankName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input
                type="text"
                name="bankAccountName"
                className="form-input"
                value={formData.bankAccountName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                className="form-input"
                value={formData.bankAccountNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                name="bankIfsc"
                className="form-input"
                placeholder="HDFC0000123"
                value={formData.bankIfsc}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={isSaving}>
            <Save size={18} /> {isSaving ? 'Saving Changes...' : 'Save Business Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
