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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    completedJobs: 0,
    activeJobs: 0,
    pendingOffers: 0,
    rating: 0,
  });
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const bookingsData = await bookingService.getMyBookings();
      
      // Separate bookings by status
      const active = bookingsData.filter(b => 
        ['accepted', 'in_progress'].includes(b.status)
      );
      const pending = bookingsData.filter(b => b.status === 'pending');
      const completed = bookingsData.filter(b => b.status === 'completed');
      
      setActiveBookings(active);
      setPendingBookings(pending);
      
      // Calculate earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const totalEarnings = completed.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
      const monthlyEarnings = completed
        .filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + (booking.total_price || 0), 0);
      
      // Fetch my services
      const servicesData = await serviceService.getMyServices();
      setMyServices(servicesData);
      
      // Update stats
      setStats({
        totalEarnings,
        monthlyEarnings,
        completedJobs: completed.length,
        activeJobs: active.length,
        pendingOffers: pending.length,
        rating: user?.rating || 0,
      });
      
      // Generate recent activity
      const activity = [
        ...pending.slice(0, 3).map(b => ({
          type: 'new_booking',
          message: `New booking request from ${b.customer_name}`,
          time: b.created_at,
          booking: b
        })),
        ...active.slice(0, 2).map(b => ({
          type: 'active_job',
          message: `Ongoing job: ${b.service_name}`,
          time: b.updated_at,
          booking: b
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
      
      setRecentActivity(activity);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'accepted');
      toast.success('Booking accepted!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'rejected');
      toast.success('Booking rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      accepted: '#2196f3',
      in_progress: '#ff9800',
      completed: '#4caf50',
      cancelled: '#f44336',
      rejected: '#9e9e9e'
    };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✓',
      in_progress: '🔧',
      completed: '✅',
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
    <div className="tasker-dashboard">
      <Navbar />
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p>Here's what's happening with your services today</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/tasker/services')}
            >
              + Add New Service
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <h3>Monthly Earnings</h3>
            <p className="stat-value">₹{stats.monthlyEarnings.toLocaleString()}</p>
            <small>Total: ₹{stats.totalEarnings.toLocaleString()}</small>
          </div>
        </div>

        <div className="stat-card active-jobs">
          <div className="stat-icon">🔧</div>
          <div className="stat-details">
            <h3>Active Jobs</h3>
            <p className="stat-value">{stats.activeJobs}</p>
            <small>{stats.completedJobs} completed</small>
          </div>
        </div>

        <div className="stat-card pending-offers">
          <div className="stat-icon">📬</div>
          <div className="stat-details">
            <h3>Pending Offers</h3>
            <p className="stat-value">{stats.pendingOffers}</p>
            <small>Awaiting response</small>
          </div>
        </div>

        <div className="stat-card rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-details">
            <h3>Your Rating</h3>
            <p className="stat-value">{stats.rating.toFixed(1)}</p>
            <small>
              {user?.professional_badge && <span className="badge">Professional ✓</span>}
            </small>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Pending Offers */}
        <div className="dashboard-section pending-section">
          <div className="section-header">
            <h2>📬 Pending Booking Requests ({pendingBookings.length})</h2>
            <button onClick={() => navigate('/tasker/bookings')}>View All</button>
          </div>
          
          {pendingBookings.length === 0 ? (
            <div className="empty-state">
              <p>🎉 No pending requests</p>
              <small>New booking requests will appear here</small>
            </div>
          ) : (
            <div className="bookings-list">
              {pendingBookings.map(booking => (
                <div key={booking._id} className="booking-card pending-card">
                  <div className="booking-header">
                    <div>
                      <h4>{booking.service_name || 'Service Request'}</h4>
                      <p className="customer-name">👤 {booking.customer_name}</p>
                    </div>
                    <div className="booking-price">₹{booking.total_price}</div>
                  </div>
                  
                  <div className="booking-details">
                    <p>📅 {new Date(booking.booking_date).toLocaleDateString()}</p>
                    <p>⏰ {booking.booking_time || 'Flexible'}</p>
                    <p>📍 {booking.address?.substring(0, 50)}...</p>
                  </div>
                  
                  {booking.description && (
                    <p className="booking-description">{booking.description}</p>
                  )}
                  
                  <div className="booking-actions">
                    <button 
                      className="btn-accept"
                      onClick={() => handleAcceptBooking(booking._id)}
                    >
                      ✓ Accept
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleRejectBooking(booking._id)}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Jobs */}
        <div className="dashboard-section active-section">
          <div className="section-header">
            <h2>🔧 Active Jobs ({activeBookings.length})</h2>
            <button onClick={() => navigate('/tasker/bookings')}>View All</button>
          </div>
          
          {activeBookings.length === 0 ? (
            <div className="empty-state">
              <p>📋 No active jobs</p>
              <small>Accepted jobs will appear here</small>
            </div>
          ) : (
            <div className="bookings-list">
              {activeBookings.map(booking => (
                <div key={booking._id} className="booking-card active-card">
                  <div className="status-badge" style={{ background: getStatusColor(booking.status) }}>
                    {getStatusIcon(booking.status)} {booking.status.replace('_', ' ').toUpperCase()}
                  </div>
                  
                  <div className="booking-header">
                    <div>
                      <h4>{booking.service_name || 'Service'}</h4>
                      <p className="customer-name">👤 {booking.customer_name}</p>
                    </div>
                    <div className="booking-price">₹{booking.total_price}</div>
                  </div>
                  
                  <div className="booking-details">
                    <p>📅 {new Date(booking.booking_date).toLocaleDateString()}</p>
                    <p>📍 {booking.address?.substring(0, 50)}...</p>
                  </div>
                  
                  <div className="booking-actions">
                    <button 
                      className="btn-view"
                      onClick={() => navigate(`/tasker/bookings`)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-chat"
                      onClick={() => navigate('/tasker/chat')}
                    >
                      💬 Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Services & Recent Activity */}
      <div className="dashboard-grid-2">
        {/* My Services */}
        <div className="dashboard-section services-section">
          <div className="section-header">
            <h2>🛠️ My Services ({myServices.length})</h2>
            <button onClick={() => navigate('/tasker/services')}>Manage</button>
          </div>
          
          {myServices.length === 0 ? (
            <div className="empty-state">
              <p>📦 No services listed</p>
              <small>Add services to start receiving bookings</small>
              <button 
                className="btn-primary-small"
                onClick={() => navigate('/tasker/services')}
              >
                + Add Your First Service
              </button>
            </div>
          ) : (
            <div className="services-list">
              {myServices.slice(0, 4).map(service => (
                <div key={service._id} className="service-mini-card">
                  <div className="service-info">
                    <h4>{service.title}</h4>
                    <p className="service-category">{service.category}</p>
                  </div>
                  <div className="service-meta">
                    <span className="service-price">₹{service.price}</span>
                    <span className={`service-status ${service.is_active ? 'active' : 'inactive'}`}>
                      {service.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section activity-section">
          <div className="section-header">
            <h2>📊 Recent Activity</h2>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>📭 No recent activity</p>
              <small>Your activity will appear here</small>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'new_booking' ? '🔔' : '🔧'}
                  </div>
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    <small>{new Date(activity.time).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/tasker/services')}
          >
            <span className="action-icon">🛠️</span>
            <span className="action-text">Manage Services</span>
          </button>
          
          <button 
            className="action-card"
            onClick={() => navigate('/tasker/bookings')}
          >
            <span className="action-icon">📋</span>
            <span className="action-text">All Bookings</span>
          </button>
          
          <button 
            className="action-card"
            onClick={() => navigate('/tasker/chat')}
          >
            <span className="action-icon">💬</span>
            <span className="action-text">Messages</span>
          </button>
          
          <button 
            className="action-card"
            onClick={() => navigate('/tasker/badges')}
          >
            <span className="action-icon">🏆</span>
            <span className="action-text">Professional Badges</span>
          </button>
          
          <button 
            className="action-card"
            onClick={() => navigate('/tasker/profile')}
          >
            <span className="action-icon">⚙️</span>
            <span className="action-text">Settings</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
