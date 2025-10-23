import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="privacy-policy-page">
      <div className="policy-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: October 23, 2025</p>

        <section className="policy-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to TrustedHands. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you about how we look after your personal data when you visit our 
            platform and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section className="policy-section">
          <h2>2. Information We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
          <ul>
            <li><strong>Identity Data:</strong> Name, username, profile picture</li>
            <li><strong>Contact Data:</strong> Email address, phone number</li>
            <li><strong>Account Data:</strong> Google account information (when using Google Sign-In)</li>
            <li><strong>Profile Data:</strong> Your role (customer/tasker), services offered, location</li>
            <li><strong>Transaction Data:</strong> Details about bookings and payments</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
            <li><strong>Usage Data:</strong> Information about how you use our platform</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your personal data for the following purposes:</p>
          <ul>
            <li>To register you as a new user and manage your account</li>
            <li>To provide and manage our services to you</li>
            <li>To facilitate bookings between customers and taskers</li>
            <li>To process payments and prevent fraud</li>
            <li>To communicate with you about your bookings and account</li>
            <li>To improve our platform and user experience</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We may share your personal data with:</p>
          <ul>
            <li><strong>Service Providers:</strong> Payment processors, cloud storage providers</li>
            <li><strong>Other Users:</strong> When you create a booking, relevant information is shared with the tasker</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </section>

        <section className="policy-section">
          <h2>5. Data Security</h2>
          <p>
            We have implemented appropriate security measures to prevent your personal data from being 
            accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal 
            data to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>
        </section>

        <section className="policy-section">
          <h2>6. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as necessary to fulfill the purposes we 
            collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </p>
        </section>

        <section className="policy-section">
          <h2>7. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data:</p>
          <ul>
            <li>Request access to your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
            <li>Request transfer of your personal data</li>
            <li>Right to withdraw consent</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>8. Third-Party Links</h2>
          <p>
            Our platform may include links to third-party websites, plug-ins, and applications. Clicking on 
            those links or enabling those connections may allow third parties to collect or share data about you. 
            We do not control these third-party websites and are not responsible for their privacy statements.
          </p>
        </section>

        <section className="policy-section">
          <h2>9. Google Sign-In</h2>
          <p>
            When you use Google Sign-In, we receive your name, email address, and profile picture from Google. 
            This information is used solely for account creation and authentication purposes. We comply with 
            Google's OAuth 2.0 policies and use secure authentication methods.
          </p>
        </section>

        <section className="policy-section">
          <h2>10. Changes to This Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new privacy policy on this page and updating the "Last Updated" date.
          </p>
        </section>

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
  );
}
