import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section footer-logo-section">
          <img src="/logo.png" alt="TrustedHands" className="footer-logo" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li onClick={() => navigate('/about')}>About Us</li>
            <li onClick={() => navigate('/faq')}>FAQ</li>
            <li onClick={() => navigate('/contact')}>Contact</li>
            <li onClick={() => navigate('/privacy-policy')}>Privacy Policy</li>
            <li onClick={() => navigate('/terms-of-service')}>Terms of Service</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: support@trustedhands.com</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 TrustedHands. All rights reserved.</p>
      </div>
    </footer>
  );
}
