import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserProfileMenu from './UserProfileMenu';
import RoleSwitcher from './RoleSwitcher';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't render authenticated navbar if user is not logged in
  if (!user) {
    return null;
  }

  const getNavigationTabs = () => {
    if (!user) return [];

    switch (user.role) {
      case 'customer':
        return [
          { label: 'Dashboard', path: '/customer/dashboard', icon: '🏠' },
          { label: 'Services', path: '/customer/services', icon: '🔧' },
          { label: 'Taskers', path: '/customer/taskers', icon: '👥' },
          { label: 'My Bookings', path: '/customer/bookings', icon: '📅' },
          { label: 'AMC', path: '/customer/amc', icon: '📋' },
          { label: 'Chat', path: '/customer/chat', icon: '💬' }
        ];
      
      case 'tasker':
        return [
          { label: 'Dashboard', path: '/tasker/dashboard', icon: '🏠' },
          { label: 'My Services', path: '/tasker/services', icon: '🔧' },
          { label: 'Bookings', path: '/tasker/bookings', icon: '📅' },
          { label: 'Chat', path: '/tasker/chat', icon: '💬' }
        ];
      
      case 'superadmin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', icon: '🏠' },
          { label: 'Users', path: '/admin/users', icon: '👥' },
          { label: 'Verifications', path: '/admin/verifications', icon: '✓' },
          { label: 'Bookings', path: '/admin/bookings', icon: '📅' },
          { label: 'AMC', path: '/admin/amc', icon: '📋' },
          { label: 'Price Ranges', path: '/admin/price-ranges', icon: '💰' }
        ];
      
      default:
        return [];
    }
  };

  const navigationTabs = getNavigationTabs();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="app-navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-logo">
            <img src="/logo.png" alt="TrustedHands" className="logo-icon" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span className="logo-text">TrustedHands</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="navbar-tabs">
          {navigationTabs.map((tab, index) => (
            <button
              key={index}
              className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* User Profile Menu */}
        <div className="navbar-profile">
          <RoleSwitcher />
          <UserProfileMenu />
        </div>
      </div>
    </nav>
  );
}
