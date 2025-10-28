import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import config from '../../config';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './CustomerProfile.css';

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
  const response = await fetch(`${config.API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      // Update user in localStorage and context
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const newUser = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      if (updateUser) {
        updateUser(newUser);
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="customer-profile">
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div className="profile-content">
          <div className="profile-main-card">
            <div className="profile-avatar-section">
              <div className="profile-pic-container">
                {user?.profile_picture && user.profile_picture !== '' ? (
                  <img 
                    src={user.profile_picture} 
                    alt={user.name} 
                    className="profile-pic"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.log('Profile image failed to load:', user.profile_picture);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="profile-pic-placeholder"
                  style={{ display: user?.profile_picture && user.profile_picture !== '' ? 'none' : 'flex' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p className="profile-role">Customer</p>
                <p className="profile-email">{user?.email}</p>
              </div>
            </div>

            <div className="divider"></div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
                <small className="form-hint">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter your address"
                />
              </div>

              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>

          <div className="profile-sidebar">
            <div className="profile-stats-card">
              <h3>Account Statistics</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <div className="stat-icon">📅</div>
                  <div className="stat-details">
                    <p className="stat-label">Member Since</p>
                    <p className="stat-value">
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">🔒</div>
                  <div className="stat-details">
                    <p className="stat-label">Account Type</p>
                    <p className="stat-value">Google Account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
