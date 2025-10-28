import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <>
      <div className="privacy-policy-page">
        <div className="policy-container">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          {/* ...existing code... */}
          <section className="policy-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> support@trustedhands.com<br />
              <strong>Phone:</strong> +1 (555) 123-4567
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
