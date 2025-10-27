import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner-content">
        <div className="rocket-wrapper">
          <div className="rocket-body">🚀</div>
        </div>
        <div className="loading-text">
          <h2>{message}</h2>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
