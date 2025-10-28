import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../config';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import './AMCManagement.css';

export default function AMCManagement() {
  const navigate = useNavigate();
  const [amcRequests, setAmcRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAMC, setSelectedAMC] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quoteData, setQuoteData] = useState({
    quoted_price: '',
    admin_notes: ''
  });

  useEffect(() => {
    fetchAMCRequests();
  }, []);

  const fetchAMCRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${config.API_BASE_URL}/amc/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch AMC requests');
      }
      
      const data = await response.json();
      setAmcRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching AMC requests:', error);
      toast.error(error.message || 'Failed to load AMC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (amcId, status) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/amc/${amcId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`AMC ${status} successfully`);
      fetchAMCRequests();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update AMC status');
    }
  };

  const handleSendQuote = async () => {
    if (!quoteData.quoted_price) {
      toast.error('Please enter a quoted price');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/amc/${selectedAMC._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoted_price: parseFloat(quoteData.quoted_price),
          admin_notes: quoteData.admin_notes,
          status: 'approved'
        })
      });

      if (!response.ok) throw new Error('Failed to send quote');

      toast.success('Quote sent successfully');
      setShowModal(false);
      setQuoteData({ quoted_price: '', admin_notes: '' });
      fetchAMCRequests();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    }
  };

  const openQuoteModal = (amc) => {
    setSelectedAMC(amc);
    setQuoteData({
      quoted_price: amc.quoted_price || '',
      admin_notes: amc.admin_notes || ''
    });
    setShowModal(true);
  };

  const filteredRequests = amcRequests.filter(amc => {
    if (filter === 'all') return true;
    return amc.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#3b82f6',
      active: '#10b981',
      rejected: '#ef4444',
      expired: '#6b7280',
      cancelled: '#9ca3af'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <>
        <Navbar />
  <LoadingScreen message="Firing Up The Engines" />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="amc-management">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>📋 AMC Management</h1>
          <p>Manage Annual Maintenance Contract requests</p>
        </div>

        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All ({amcRequests.length})
          </button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            ⏳ Pending ({amcRequests.filter(a => a.status === 'pending').length})
          </button>
        <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
          ✓ Approved ({amcRequests.filter(a => a.status === 'approved').length})
        </button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
          🟢 Active ({amcRequests.filter(a => a.status === 'active').length})
        </button>
        <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
          ❌ Rejected ({amcRequests.filter(a => a.status === 'rejected').length})
        </button>
      </div>

      <div className="amc-grid">
        {filteredRequests.map(amc => (
          <div key={amc._id} className="amc-card">
            <div className="amc-header">
              <div>
                <h3>{amc.company_name}</h3>
                <p className="amc-id">ID: #{amc._id.slice(-6)}</p>
              </div>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(amc.status) }}
              >
                {amc.status.toUpperCase()}
              </span>
            </div>

            <div className="amc-details">
              <div className="detail-item">
                <span className="label">👤 Contact Person:</span>
                <span className="value">{amc.contact_person}</span>
              </div>
              <div className="detail-item">
                <span className="label">📧 Email:</span>
                <span className="value">{amc.contact_email}</span>
              </div>
              <div className="detail-item">
                <span className="label">📞 Phone:</span>
                <span className="value">{amc.contact_phone}</span>
              </div>
              <div className="detail-item">
                <span className="label">📍 Address:</span>
                <span className="value">{amc.address}</span>
              </div>
              <div className="detail-item">
                <span className="label">🛠️ Services:</span>
                <span className="value">{amc.service_types?.join(', ')}</span>
              </div>
              <div className="detail-item">
                <span className="label">⏱️ Duration:</span>
                <span className="value">{amc.duration_months} months</span>
              </div>
              <div className="detail-item">
                <span className="label">🔄 Frequency:</span>
                <span className="value">{amc.frequency}</span>
              </div>
              {amc.estimated_budget && (
                <div className="detail-item">
                  <span className="label">💰 Est. Budget:</span>
                  <span className="value">₹{amc.estimated_budget.toLocaleString()}</span>
                </div>
              )}
              {amc.quoted_price && (
                <div className="detail-item">
                  <span className="label">💵 Quoted Price:</span>
                  <span className="value price">₹{amc.quoted_price.toLocaleString()}</span>
                </div>
              )}
            </div>

            {amc.description && (
              <div className="amc-description">
                <strong>Description:</strong>
                <p>{amc.description}</p>
              </div>
            )}

            <div className="amc-actions">
              {amc.status === 'pending' && (
                <>
                  <button 
                    className="btn-approve"
                    onClick={() => openQuoteModal(amc)}
                  >
                    ✓ Send Quote
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleUpdateStatus(amc._id, 'rejected')}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              {amc.status === 'approved' && (
                <button 
                  className="btn-activate"
                  onClick={() => handleUpdateStatus(amc._id, 'active')}
                >
                  🟢 Activate Contract
                </button>
              )}
            </div>

            <div className="amc-footer">
              Created: {new Date(amc.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="no-data">
          <p>No AMC requests found</p>
        </div>
      )}

      {/* Quote Modal */}
      {showModal && selectedAMC && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Quote - {selectedAMC.company_name}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Quoted Price (₹) *</label>
                <input
                  type="number"
                  value={quoteData.quoted_price}
                  onChange={(e) => setQuoteData({ ...quoteData, quoted_price: e.target.value })}
                  placeholder="Enter quoted price"
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  value={quoteData.admin_notes}
                  onChange={(e) => setQuoteData({ ...quoteData, admin_notes: e.target.value })}
                  placeholder="Add any notes for the customer..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleSendQuote}>
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}
