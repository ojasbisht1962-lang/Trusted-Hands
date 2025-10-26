import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'customer') return '/customer/dashboard';
    if (user?.role === 'tasker') return '/tasker/dashboard';
    if (user?.role === 'superadmin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <nav className="public-navbar">
      <div className="public-nav-container">
        <div className="public-brand" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="TrustedHands" className="public-logo-icon" />
          <span className="public-logo-text">TrustedHands</span>
        </div>
        <div className="public-nav-links">
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="btn-public-nav">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/" className="public-nav-link">Home</Link>
              <Link to="/about" className="public-nav-link">About</Link>
              <Link to="/faq" className="public-nav-link">FAQ</Link>
              <Link to="/contact" className="public-nav-link">Contact</Link>
              <Link to="/login" className="btn-public-nav">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
