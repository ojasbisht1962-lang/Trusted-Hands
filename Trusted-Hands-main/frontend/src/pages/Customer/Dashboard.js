import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService, serviceService } from '../../services/apiService';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    pendingBookings: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [popularServices, setPopularServices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings
      const bookings = await bookingService.getMyBookings();
      
      // Calculate stats
      const active = bookings.filter(b => b.status === 'accepted' || b.status === 'in_progress').length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const pending = bookings.filter(b => b.status === 'pending').length;
      const spent = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      setStats({
        activeBookings: active,
        completedBookings: completed,
        totalSpent: spent,
        pendingBookings: pending
      });

      // Get recent bookings (last 5)
      setRecentBookings(bookings.slice(0, 5));

      // Fetch popular services
      const services = await serviceService.getServices({ limit: 6 });
      setPopularServices(services);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data);
      toast.error(`Failed to load dashboard data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#3b82f6',
      in_progress: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444',
      rejected: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      in_progress: '🔄',
      completed: '✓',
      cancelled: '❌',
      rejected: '⛔'
    };
    return icons[status] || '📋';
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
    <div className="customer-dashboard-container">
      <Navbar />
      
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>👋 Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p>Manage your bookings and find services</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-browse-services"
            onClick={() => navigate('/customer/services')}
          >
            🔍 Browse Services
          </button>
          <button 
            className="btn-find-providers"
            onClick={() => navigate('/customer/providers')}
          >
            ⭐ Find Providers
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/customer/bookings')}>
          <div className="stat-icon active">🔄</div>
          <div className="stat-details">
            <h3>{stats.activeBookings}</h3>
            <p>Active Bookings</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/customer/bookings')}>
          <div className="stat-icon pending">⏳</div>
          <div className="stat-details">
            <h3>{stats.pendingBookings}</h3>
            <p>Pending Bookings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">✓</div>
          <div className="stat-details">
            <h3>{stats.completedBookings}</h3>
            <p>Completed Jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon spent">💰</div>
          <div className="stat-details">
            <h3>₹{stats.totalSpent.toLocaleString()}</h3>
            <p>Total Spent</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Bookings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📋 Recent Bookings</h2>
            <button 
              className="btn-view-all"
              onClick={() => navigate('/customer/bookings')}
            >
              View All
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="empty-state-small">
              <p>No bookings yet</p>
              <button 
                className="btn-primary-small"
                onClick={() => navigate('/customer/services')}
              >
                Book a Service
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {recentBookings.map(booking => (
                <div 
                  key={booking._id} 
                  className="booking-item"
                  onClick={() => navigate('/customer/bookings')}
                >
                  <div className="booking-info">
                    <div className="booking-title">
                      <span className="status-icon" style={{ color: getStatusColor(booking.status) }}>
                        {getStatusIcon(booking.status)}
                      </span>
                      <span>{booking.service?.title || 'Service'}</span>
                    </div>
                    <p className="booking-date">
                      {new Date(booking.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="booking-price">
                    ₹{booking.total_price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Services */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🌟 Popular Services</h2>
            <button 
              className="btn-view-all"
              onClick={() => navigate('/customer/services')}
            >
              View All
            </button>
          </div>

          {popularServices.length === 0 ? (
            <div className="empty-state-small">
              <p>No services available</p>
            </div>
          ) : (
            <div className="services-list">
              {popularServices.map(service => (
                <div 
                  key={service._id} 
                  className="service-item"
                  onClick={() => navigate(`/customer/services/${service._id}`)}
                >
                  <div className="service-icon">
                    {service.service_type === 'technical' ? '🔧' : '🏠'}
                  </div>
                  <div className="service-info">
                    <h4>{service.title}</h4>
                    <p className="service-tasker">
                      By {service.tasker?.name || 'Tasker'}
                      {service.tasker?.professional_badge && ' ✓'}
                    </p>
                    <p className="service-price">{service.price} <span>/ {service.price_unit}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-card"
            onClick={() => navigate('/customer/services')}
          >
            <div className="action-icon">🔍</div>
            <h3>Browse Services</h3>
            <p>Find the perfect service for your needs</p>
          </button>

          <button 
            className="quick-action-card"
            onClick={() => navigate('/customer/bookings')}
          >
            <div className="action-icon">📅</div>
            <h3>My Bookings</h3>
            <p>View and manage your bookings</p>
          </button>

          <button 
            className="quick-action-card"
            onClick={() => navigate('/customer/chat')}
          >
            <div className="action-icon">💬</div>
            <h3>Messages</h3>
            <p>Chat with taskers</p>
          </button>

          <button 
            className="quick-action-card"
            onClick={() => navigate('/customer/amc')}
          >
            <div className="action-icon">📝</div>
            <h3>AMC Requests</h3>
            <p>Manage annual maintenance contracts</p>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
