import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Sliders,
  Download,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const ProductListPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('New Stock Received');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    sku: '',
    barcode: '',
    description: '',
    unit: 'PCS',
    sellingPrice: '',
    purchaseCost: '',
    currentStock: '0',
    minStockThreshold: '5',
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let query = '?';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (selectedCategory) query += `categoryId=${selectedCategory}&`;
      if (onlyLowStock) query += `lowStock=true&`;

      const [prodRes, catRes]: any = await Promise.all([
        api.get(`/products${query}`),
        api.get('/categories'),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err: any) {
      showToast('Failed to load inventory items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [selectedCategory, onlyLowStock, business?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInitialData();
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      sku: '',
      barcode: '',
      description: '',
      unit: 'PCS',
      sellingPrice: '',
      purchaseCost: '',
      currentStock: '0',
      minStockThreshold: '5',
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      sku: p.sku,
      barcode: p.barcode || '',
      description: p.description || '',
      unit: p.unit,
      sellingPrice: p.sellingPrice.toString(),
      purchaseCost: p.purchaseCost.toString(),
      currentStock: p.currentStock.toString(),
      minStockThreshold: p.minStockThreshold.toString(),
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice) {
      showToast('Name and selling price are required', 'error');
      return;
    }

    try {
      if (editingProduct) {
        const res: any = await api.patch(`/products/${editingProduct.id}`, formData);
        if (res.success) {
          showToast('Product updated successfully', 'success');
        }
      } else {
        const res: any = await api.post('/products', formData);
        if (res.success) {
          showToast('Product added to inventory', 'success');
        }
      }
      setIsAddModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentProduct || adjustmentQty === 0) return;

    try {
      const res: any = await api.post(`/products/${stockAdjustmentProduct.id}/adjust-stock`, {
        adjustmentQuantity: adjustmentQty,
        reason: adjustmentReason,
      });

      if (res.success) {
        showToast(`Stock updated for ${stockAdjustmentProduct.name}`, 'success');
        setStockAdjustmentProduct(null);
        setAdjustmentQty(0);
        fetchInitialData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust stock', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Archive "${name}" from active catalogue? Existing invoice records will be preserved.`)) {
      return;
    }
    try {
      const res: any = await api.delete(`/products/${id}`);
      if (res.success) {
        showToast('Product archived successfully', 'success');
        fetchInitialData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Name', 'SKU', 'Category', 'Unit', 'Selling Price (INR)', 'Purchase Cost (INR)', 'Current Stock', 'Min Threshold'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `"${(p.categoryName || '').replace(/"/g, '""')}"`,
      p.unit,
      p.sellingPrice,
      p.purchaseCost,
      p.currentStock,
      p.minStockThreshold,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bizsathi_inventory_${business?.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amt: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Products & Stock Inventory</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
            Real-time stock balance, selling prices, and reorder levels
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by product name, SKU or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--color-muted)' }} />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
            />
            <span style={{ color: onlyLowStock ? '#C62828' : 'inherit', fontWeight: onlyLowStock ? 600 : 400 }}>
              Low Stock Only
            </span>
          </label>

          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      {/* Product Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU / Barcode</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Purchase Cost</th>
              <th>Current Stock</th>
              <th>Min Threshold</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={8}>
                    <div style={{ height: '30px' }} className="skeleton" />
                  </td>
                </tr>
              ))
            ) : products.length > 0 ? (
              products.map((p) => {
                const isLow = p.currentStock <= p.minStockThreshold;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{p.sku}</div>
                      {p.barcode && <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{p.barcode}</div>}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.categoryName}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>{formatCurrency(p.purchaseCost)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 700, color: isLow ? '#C62828' : 'inherit' }}>
                          {p.currentStock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                            LOW
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-muted)' }}>{p.minStockThreshold} {p.unit}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setStockAdjustmentProduct(p);
                            setAdjustmentQty(0);
                          }}
                          title="Adjust Stock"
                        >
                          <Sliders size={14} /> Stock
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{ color: 'var(--color-error)' }}
                          title="Archive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
                  No inventory products found matching your filters. Click "+ Add Product" to add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Polycab 1.5 sq mm FR Wire (90m, Red)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PLY-15-RED"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1650"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1350"
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit of Measure</label>
                    <select
                      className="form-select"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="BOX">BOX</option>
                      <option value="MTR">MTR (Meters)</option>
                      <option value="KG">KG (Kilograms)</option>
                      <option value="PKT">PKT (Packets)</option>
                    </select>
                  </div>
                </div>

                {!editingProduct && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Initial Stock Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Low Stock Threshold</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.minStockThreshold}
                        onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description / Specifications</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short item details or size specifications"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      {stockAdjustmentProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Manual Stock Adjustment</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setStockAdjustmentProduct(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleStockAdjustment}>
              <div className="modal-body">
                <div style={{ background: '#f5f7f5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600 }}>{stockAdjustmentProduct.name}</div>
                  <div style={{ color: 'var(--color-muted)' }}>
                    Current Stock: <strong>{stockAdjustmentProduct.currentStock} {stockAdjustmentProduct.unit}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Quantity Adjustment (Use + to add, - to subtract)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. +10 or -2"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    required
                  />
                  <div className="form-help">
                    New Stock will be: <strong>{stockAdjustmentProduct.currentStock + adjustmentQty} {stockAdjustmentProduct.unit}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Adjustment</label>
                  <select
                    className="form-select"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  >
                    <option value="New Stock Received">New Stock Received from Distributor</option>
                    <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                    <option value="Inventory Count Correction">Physical Inventory Count Correction</option>
                    <option value="Customer Return">Customer Return</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStockAdjustmentProduct(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
