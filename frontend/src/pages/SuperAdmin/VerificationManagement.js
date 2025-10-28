import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import config from '../../config';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import './VerificationManagement.css';

export default function VerificationManagement() {
  const navigate = useNavigate();
  const [taskers, setTaskers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchTaskers();
  }, []);

  const fetchTaskers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch taskers');
      
      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : (data.users || []);
      const taskersOnly = usersArray.filter(u => u.role === 'tasker');
      setTaskers(taskersOnly);
    } catch (error) {
      console.error('Error fetching taskers:', error);
      toast.error('Failed to load taskers');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (taskerId, status) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${config.API_BASE_URL}/admin/taskers/${taskerId}/verification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update verification');
      }

      toast.success(`Tasker ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchTaskers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error(error.message || 'Failed to update verification status');
    }
  };

  const filteredTaskers = taskers.filter(tasker => {
    if (filter === 'all') return true;
    return tasker.verification_status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      not_applied: '#6b7280'
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
      <div className="verification-management">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>✓ Verification Management</h1>
          <p>Review and verify tasker applications</p>
        </div>

        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All Taskers ({taskers.length})
          </button>
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            ⏳ Pending ({taskers.filter(t => t.verification_status === 'pending').length})
          </button>
        <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
          ✓ Verified ({taskers.filter(t => t.verification_status === 'approved').length})
        </button>
        <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
          ❌ Rejected ({taskers.filter(t => t.verification_status === 'rejected').length})
        </button>
      </div>

      {filteredTaskers.length > 0 ? (
      <div className="taskers-grid">
        {filteredTaskers.map(tasker => (
          <div key={tasker._id} className="tasker-card">
            <div className="tasker-header">
              {tasker.profile_picture ? (
                <img src={tasker.profile_picture} alt={tasker.name} className="tasker-avatar" />
              ) : (
                <div className="tasker-avatar-placeholder">{tasker.name.charAt(0)}</div>
              )}
              <div className="tasker-info">
                <h3>{tasker.name}</h3>
                <p>{tasker.email}</p>
              </div>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(tasker.verification_status) }}
              >
                {tasker.verification_status?.toUpperCase() || 'PENDING'}
              </span>
            </div>

            <div className="tasker-details">
              <div className="detail-row">
                <span className="label">📞 Phone:</span>
                <span className="value">{tasker.phone || 'Not provided'}</span>
              </div>
              <div className="detail-row">
                <span className="label">🔧 Type:</span>
                <span className="value">{tasker.tasker_type || 'N/A'}</span>
              </div>
              {tasker.skills && tasker.skills.length > 0 && (
                <div className="detail-row">
                  <span className="label">💼 Skills:</span>
                  <span className="value">{tasker.skills.join(', ')}</span>
                </div>
              )}
              {tasker.experience_years && (
                <div className="detail-row">
                  <span className="label">⏱️ Experience:</span>
                  <span className="value">{tasker.experience_years} years</span>
                </div>
              )}
              {tasker.bio && (
                <div className="detail-row">
                  <span className="label">📝 Bio:</span>
                  <span className="value">{tasker.bio}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">📅 Joined:</span>
                <span className="value">{new Date(tasker.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {tasker.verification_status === 'pending' && (
              <div className="verification-actions">
                <button 
                  className="btn-verify"
                  onClick={() => handleVerification(tasker._id, 'approved')}
                >
                  ✓ Verify
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleVerification(tasker._id, 'rejected')}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      ) : (
        <div className="no-data">
          <p>No taskers found</p>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}
