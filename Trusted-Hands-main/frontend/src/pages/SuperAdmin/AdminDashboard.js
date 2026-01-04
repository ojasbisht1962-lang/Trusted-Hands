import React, { useState, useEffect } from 'react';
import { adminAnalyticsService } from '../../services/adminService';
import { toast } from 'react-toastify';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState(null);
  const [bookingDistribution, setBookingDistribution] = useState(null);
  const [topTaskers, setTopTaskers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsData, trendsData, distributionData, taskersData] = await Promise.all([
        adminAnalyticsService.getDashboardStats(),
        adminAnalyticsService.getRevenueTrends('month'),
        adminAnalyticsService.getBookingDistribution(),
        adminAnalyticsService.getTopTaskers(5),
      ]);

      setStats(statsData);
      setRevenueTrends(trendsData);
      setBookingDistribution(distributionData);
      setTopTaskers(taskersData.top_taskers);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="admin-dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
        <Footer />
      </>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Revenue trends chart data
  const revenueChartData = {
    labels: revenueTrends?.data?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Total Revenue',
        data: revenueTrends?.data?.map(d => d.revenue) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Platform Commission',
        data: revenueTrends?.data?.map(d => d.commission) || [],
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.4,
      },
    ],
  };

  // Booking distribution pie chart
  const bookingPieData = {
    labels: bookingDistribution?.distribution?.map(d => d.status) || [],
    datasets: [
      {
        data: bookingDistribution?.distribution?.map(d => d.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <>
      <Navbar />
      <div className="admin-dashboard-container">
        <div className="admin-header">
          <h1>🎯 Admin Command Center</h1>
          <p className="admin-subtitle">Comprehensive Platform Management Dashboard</p>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Bookings
          </button>
          <button
            className={`admin-tab ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            💰 Financial
          </button>
          <button
            className={`admin-tab ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            🎧 Support
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Key Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card revenue">
                <div className="metric-icon">💰</div>
                <div className="metric-details">
                  <h3>Total Revenue</h3>
                  <p className="metric-value">{formatCurrency(stats?.overview?.total_revenue || 0)}</p>
                  <span className="metric-subtitle">Platform Commission: {formatCurrency(stats?.overview?.platform_commission || 0)}</span>
                </div>
              </div>

              <div className="metric-card users">
                <div className="metric-icon">👥</div>
                <div className="metric-details">
                  <h3>Total Users</h3>
                  <p className="metric-value">{stats?.overview?.total_users || 0}</p>
                  <span className="metric-subtitle">
                    Customers: {stats?.overview?.total_customers} | Taskers: {stats?.overview?.total_taskers}
                  </span>
                </div>
              </div>

              <div className="metric-card bookings">
                <div className="metric-icon">📅</div>
                <div className="metric-details">
                  <h3>Total Bookings</h3>
                  <p className="metric-value">{stats?.overview?.total_bookings || 0}</p>
                  <span className="metric-subtitle">
                    Active: {stats?.overview?.active_bookings} | Completed: {stats?.overview?.completed_bookings}
                  </span>
                </div>
              </div>

              <div className="metric-card avg-order">
                <div className="metric-icon">📈</div>
                <div className="metric-details">
                  <h3>Avg Order Value</h3>
                  <p className="metric-value">{formatCurrency(stats?.overview?.avg_order_value || 0)}</p>
                  <span className="metric-subtitle">Per completed booking</span>
                </div>
              </div>
            </div>

            {/* This Month Stats */}
            <div className="section-card">
              <h2>📅 This Month's Performance</h2>
              <div className="monthly-stats">
                <div className="monthly-stat">
                  <span className="stat-label">New Bookings</span>
                  <span className="stat-value">{stats?.this_month?.bookings || 0}</span>
                </div>
                <div className="monthly-stat">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value">{formatCurrency(stats?.this_month?.revenue || 0)}</span>
                </div>
                <div className="monthly-stat">
                  <span className="stat-label">Commission Earned</span>
                  <span className="stat-value">{formatCurrency(stats?.this_month?.commission || 0)}</span>
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            {(stats?.pending_actions?.verifications > 0 ||
              stats?.pending_actions?.badge_applications > 0 ||
              stats?.pending_actions?.open_complaints > 0) && (
              <div className="section-card alert-card">
                <h2>⚠️ Pending Actions</h2>
                <div className="pending-actions">
                  {stats?.pending_actions?.verifications > 0 && (
                    <div className="pending-item">
                      <span className="pending-icon">✓</span>
                      <span>{stats.pending_actions.verifications} Tasker Verifications Pending</span>
                    </div>
                  )}
                  {stats?.pending_actions?.badge_applications > 0 && (
                    <div className="pending-item">
                      <span className="pending-icon">🏆</span>
                      <span>{stats.pending_actions.badge_applications} Badge Applications Pending</span>
                    </div>
                  )}
                  {stats?.pending_actions?.open_complaints > 0 && (
                    <div className="pending-item">
                      <span className="pending-icon">🎧</span>
                      <span>{stats.pending_actions.open_complaints} Open Support Tickets</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-card">
                <h2>📈 Revenue Trends (Last 30 Days)</h2>
                <div className="chart-container">
                  <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              </div>

              <div className="chart-card">
                <h2>🎯 Booking Status Distribution</h2>
                <div className="chart-container pie-chart">
                  <Pie data={bookingPieData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              </div>
            </div>

            {/* Top Performing Taskers */}
            <div className="section-card">
              <h2>⭐ Top Performing Taskers</h2>
              <div className="top-taskers-list">
                {topTaskers.map((tasker, index) => (
                  <div key={tasker.tasker_id} className="tasker-card">
                    <div className="tasker-rank">#{index + 1}</div>
                    <div className="tasker-info">
                      <h3>{tasker.name}</h3>
                      <p className="tasker-email">{tasker.email}</p>
                    </div>
                    <div className="tasker-stats">
                      <div className="stat">
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value">{formatCurrency(tasker.total_revenue)}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Bookings</span>
                        <span className="stat-value">{tasker.total_bookings}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Rating</span>
                        <span className="stat-value">⭐ {tasker.avg_rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                    {tasker.badges.length > 0 && (
                      <div className="tasker-badges">
                        {tasker.badges.map(badge => (
                          <span key={badge} className={`badge ${badge}`}>
                            {badge === 'gold' && '🥇'}
                            {badge === 'silver' && '🥈'}
                            {badge === 'bronze' && '🥉'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-content">
            <div className="coming-soon-placeholder">
              <h2>👥 User Management</h2>
              <p>Advanced user management interface coming soon...</p>
              <p>Features: Block/Unblock users, View details, Verify taskers, User analytics</p>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bookings-content">
            <div className="coming-soon-placeholder">
              <h2>📅 Booking Management</h2>
              <p>Comprehensive booking management interface coming soon...</p>
              <p>Features: Active bookings, Payment control, Cancel bookings, Booking timeline</p>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="financial-content">
            <div className="coming-soon-placeholder">
              <h2>💰 Financial Management</h2>
              <p>Financial analytics and payment control coming soon...</p>
              <p>Features: Hold/Release payments, Refunds, Revenue reports, Commission settings</p>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="support-content">
            <div className="coming-soon-placeholder">
              <h2>🎧 Support & Complaints</h2>
              <p>Support ticket management interface coming soon...</p>
              <p>Features: Customer complaints, Tasker complaints, Dispute resolution</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
