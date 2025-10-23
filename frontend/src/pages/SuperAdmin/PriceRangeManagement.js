import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../config';
import './PriceRangeManagement.css';

export default function PriceRangeManagement() {
  const navigate = useNavigate();
  const [priceRanges, setPriceRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRange, setEditingRange] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    min_price: '',
    max_price: '',
    description: ''
  });

  const categories = [
    { label: 'Electrician', value: 'electrician' },
    { label: 'Plumber', value: 'plumber' },
    { label: 'Carpenter', value: 'carpenter' },
    { label: 'AC Servicing', value: 'ac_servicing' },
    { label: 'RO Servicing', value: 'ro_servicing' },
    { label: 'Appliance Repair', value: 'appliance_repair' },
    { label: 'Painting', value: 'painting' },
    { label: 'Pest Control', value: 'pest_control' },
    { label: 'Car Washing', value: 'car_washing' },
    { label: 'Bathroom Cleaning', value: 'bathroom_cleaning' },
    { label: 'Home Cleaning', value: 'home_cleaning' },
    { label: 'Assignment Writing', value: 'assignment_writing' },
    { label: 'Project Making', value: 'project_making' },
    { label: 'Tutoring', value: 'tutoring' },
    { label: 'Pet Care', value: 'pet_care' },
    { label: 'Gardening', value: 'gardening' },
    { label: 'Delivery', value: 'delivery' },
    { label: 'Other', value: 'other' }
  ];

  useEffect(() => {
    fetchPriceRanges();
  }, []);

  const fetchPriceRanges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/admin/price-ranges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch price ranges');
      
      const data = await response.json();
      setPriceRanges(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      toast.error('Failed to load price ranges');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseFloat(formData.min_price) >= parseFloat(formData.max_price)) {
      toast.error('Maximum price must be greater than minimum price');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = editingRange 
        ? `${config.API_BASE_URL}/admin/price-ranges/${editingRange._id}`
        : `${config.API_BASE_URL}/admin/price-ranges`;
      
      const response = await fetch(url, {
        method: editingRange ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: formData.category,
          min_price: parseFloat(formData.min_price),
          max_price: parseFloat(formData.max_price),
          description: formData.description
        })
      });

      if (!response.ok) throw new Error('Failed to save price range');

      toast.success(`Price range ${editingRange ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchPriceRanges();
    } catch (error) {
      console.error('Error saving price range:', error);
      toast.error('Failed to save price range');
    }
  };

  const handleEdit = (range) => {
    setEditingRange(range);
    setFormData({
      category: range.category,
      min_price: range.min_price.toString(),
      max_price: range.max_price.toString(),
      description: range.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (rangeId) => {
    if (!window.confirm('Are you sure you want to delete this price range?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/admin/price-ranges/${rangeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete price range');

      toast.success('Price range deleted successfully');
      fetchPriceRanges();
    } catch (error) {
      console.error('Error deleting price range:', error);
      toast.error('Failed to delete price range');
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      min_price: '',
      max_price: '',
      description: ''
    });
    setEditingRange(null);
  };

  const getCategoryLabel = (value) => {
    const category = categories.find(c => c.value === value);
    if (category) return category.label;
    // Fallback: capitalize and format the raw value
    return value ? value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  };

  if (loading) {
    return (
      <div className="price-management">
        <div className="loading">Loading price ranges...</div>
      </div>
    );
  }

  return (
    <div className="price-management">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <div>
            <h1>💰 Price Range Management</h1>
            <p>Set recommended price ranges for each service category</p>
          </div>
          <button className="btn-add" onClick={() => setShowModal(true)}>
            + Add Price Range
          </button>
        </div>
      </div>

      <div className="price-grid">
        {priceRanges.map(range => (
          <div key={range._id} className="price-card">
            <div className="price-header">
              <h3>{getCategoryLabel(range.category || range.service_category)}</h3>
              <div className="price-actions">
                <button className="btn-edit" onClick={() => handleEdit(range)}>
                  ✏️
                </button>
                <button className="btn-delete" onClick={() => handleDelete(range._id)}>
                  🗑️
                </button>
              </div>
            </div>
            <div className="price-range">
              <span className="price-min">₹{range.min_price.toLocaleString()}</span>
              <span className="price-separator">-</span>
              <span className="price-max">₹{range.max_price.toLocaleString()}</span>
            </div>
            {range.description && (
              <p className="price-description">{range.description}</p>
            )}
            <div className="price-footer">
              Updated: {new Date(range.updated_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {priceRanges.length === 0 && (
        <div className="no-data">
          <p>No price ranges configured</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Add First Price Range
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRange ? 'Edit Price Range' : 'Add Price Range'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Service Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled={!!editingRange}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.min_price}
                      onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                      placeholder="e.g., 500"
                      min="0"
                      step="50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.max_price}
                      onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                      placeholder="e.g., 2000"
                      min="0"
                      step="50"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add any notes about this price range..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingRange ? 'Update' : 'Add'} Price Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
