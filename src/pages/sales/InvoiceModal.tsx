import React from 'react';
import { X, Printer, CheckCircle2, QrCode } from 'lucide-react';
import './Sales.css';

interface InvoiceModalProps {
  sale: any;
  business: any;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, business, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Tax Invoice #{sale.invoiceNumber}
            </span>
            <span
              className={`badge ${
                sale.paymentStatus === 'PAID'
                  ? 'badge-success'
                  : sale.paymentStatus === 'PARTIAL'
                  ? 'badge-warning'
                  : 'badge-danger'
              }`}
            >
              {sale.paymentStatus}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={16} /> Print / Save PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: '#f5f7f5', padding: '1.5rem' }}>
          {/* Printable Invoice Sheet */}
          <div className="invoice-paper" id="printable-invoice">
            {/* Header */}
            <div className="invoice-header-row">
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16834A', margin: 0 }}>
                  {business?.name || 'Sharma Electricals & Hardware'}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.25rem' }}>
                  {business?.address && <div>{business.address}, {business.city}, {business.state} - {business.pincode}</div>}
                  <div>Phone: {business?.phone} | Email: {business?.email}</div>
                  {business?.gstin && <div style={{ fontWeight: 600 }}>GSTIN: {business.gstin}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#202820' }}>TAX INVOICE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16834A' }}>
                  #{sale.invoiceNumber}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#666' }}>
                  Date: {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Customer Snapshot */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: '#f9fbf9',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e1ebe2',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                  BILLED TO:
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sale.customerSnapshot?.name}</div>
                <div style={{ color: '#555' }}>Phone: {sale.customerSnapshot?.phone}</div>
                {sale.customerSnapshot?.address && (
                  <div style={{ color: '#666', fontSize: '0.78rem' }}>{sale.customerSnapshot.address}</div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                  PAYMENT DETAILS:
                </div>
                <div style={{ fontWeight: 600 }}>Method: {sale.paymentMethod}</div>
                <div>Status: <strong style={{ color: sale.balanceDue === 0 ? '#16834A' : '#C62828' }}>{sale.paymentStatus}</strong></div>
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Item Description</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right' }}>Discount</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((it: any, index: number) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{it.name}</strong>
                    </td>
                    <td style={{ color: '#666', fontSize: '0.78rem' }}>{it.sku}</td>
                    <td style={{ textAlign: 'center' }}>
                      {it.quantity} {it.unit}
                    </td>
                    <td style={{ textAlign: 'right' }}>{it.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#666' }}>
                      {it.discount > 0 ? `₹${it.discount}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & UPI QR Code Box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#666', maxWidth: '320px' }}>
                {business?.upiId && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: '#F1F8F3',
                      border: '1px solid #C8E6C9',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <QrCode size={36} color="#16834A" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#105C36' }}>Pay via UPI</div>
                      <div style={{ fontSize: '0.75rem', color: '#2e7d32' }}>{business.upiId}</div>
                    </div>
                  </div>
                )}
                {business?.bankDetails?.accountNumber && (
                  <div style={{ fontSize: '0.75rem' }}>
                    <strong>Bank:</strong> {business.bankDetails.bankName} | <strong>A/C:</strong>{' '}
                    {business.bankDetails.accountNumber} | <strong>IFSC:</strong>{' '}
                    {business.bankDetails.ifsc}
                  </div>
                )}
                {sale.notes && (
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                    <strong>Note:</strong> {sale.notes}
                  </div>
                )}
              </div>

              <div className="invoice-totals-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#C62828' }}>
                    <span>Total Discount:</span>
                    <span>- {formatCurrency(sale.totalDiscount)}</span>
                  </div>
                )}
                {sale.taxRatePercent > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <span>GST ({sale.taxRatePercent}%):</span>
                    <span>{formatCurrency(sale.totalTax)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderTop: '2px solid #16834A',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#16834A',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>{formatCurrency(sale.grandTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#555' }}>
                  <span>Paid Amount:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(sale.paidAmount)}</span>
                </div>
                {sale.balanceDue > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.25rem 0',
                      color: '#C62828',
                      fontWeight: 700,
                    }}
                  >
                    <span>Balance Due (Udhaar):</span>
                    <span>{formatCurrency(sale.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Signature */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #E2E9E2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '0.75rem',
                color: '#666',
              }}
            >
              <div>
                <div>1. Goods once sold can be returned within 3 days in original packaging.</div>
                <div>2. Subject to local jurisdiction. Thank you for your business!</div>
              </div>
              <div style={{ textAlign: 'center', width: '180px' }}>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px dashed #999', paddingTop: '0.25rem', fontWeight: 600 }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
