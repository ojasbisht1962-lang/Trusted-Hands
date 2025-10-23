import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/apiService';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        console.log('Login attempt with role:', selectedRole);
        const result = await authService.googleLogin(tokenResponse.access_token, selectedRole);
        console.log('Login result:', result);
        console.log('User role from backend:', result.user.role);
        
        login(result.access_token, result.user);
        
        toast.success(`Welcome ${result.user.name}!`);
        
        // Redirect based on role
        if (result.user.role === 'customer') {
          console.log('Redirecting to customer dashboard');
          navigate('/customer/dashboard');
        } else if (result.user.role === 'tasker') {
          // Check if tasker needs to complete profile
          if (!result.user.age) {
            console.log('Redirecting to tasker onboarding');
            navigate('/tasker/onboarding');
          } else {
            console.log('Redirecting to tasker dashboard');
            navigate('/tasker/dashboard');
          }
        } else if (result.user.role === 'superadmin') {
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        toast.error(error.response?.data?.detail || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error('Google login failed. Please try again.');
    },
  });

  return (
    <div className="login-container">
      <div className="login-box scale-in">
        <div className="login-header">
          <h1>
            <img src="/logo.png" alt="TrustedHands" style={{ width: '42px', height: '42px', objectFit: 'contain', marginRight: '10px', verticalAlign: 'middle' }} />
            Welcome to TrustedHands
          </h1>
          <p>Your trusted marketplace for freelance and gig services</p>
        </div>

        <div className="role-selector">
          <h3>Login as:</h3>
          <div className="role-buttons">
            <button
              className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
            >
              <span className="role-icon">👤</span>
              <span>Customer</span>
            </button>
            <button
              className={`role-btn ${selectedRole === 'tasker' ? 'active' : ''}`}
              onClick={() => setSelectedRole('tasker')}
            >
              <span className="role-icon">⚡</span>
              <span>Tasker</span>
            </button>
            <button
              className={`role-btn ${selectedRole === 'superadmin' ? 'active' : ''}`}
              onClick={() => setSelectedRole('superadmin')}
            >
              <span className="role-icon">👑</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        <button
          className="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width="20"
                height="20"
              />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="login-footer">
          <p>
            By continuing, you agree to our{' '}
            <a href="/terms">Terms of Service</a> and{' '}
            <a href="/privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
