import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import './PrivacyPolicy.css';
import LoadingScreen from '../../components/LoadingScreen';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading Privacy Policy..." />;
  }

  return (
    <>
      <div className="privacy-policy-page">
        <div className="policy-container">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
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