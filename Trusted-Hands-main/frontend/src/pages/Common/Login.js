import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/apiService';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('customer');
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Email login attempt with role:', selectedRole);
      const result = await authService.emailLogin(formData.email, formData.password, selectedRole);
      
      login(result.access_token, result.user);
      toast.success(`Welcome back, ${result.user.name}!`);
      
      redirectByRole(result.user.role);
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if user is not registered (404 status)
      if (error.response?.status === 404) {
        toast.error(
          error.response?.data?.detail || 
          "Account not found. You haven't registered yet. Please sign up to create an account.",
          { autoClose: 5000 }
        );
        // Automatically switch to signup mode after a short delay
        setTimeout(() => {
          setAuthMode('signup');
        }, 2000);
      } else {
        toast.error(error.response?.data?.detail || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Signup attempt with role:', selectedRole);
      const result = await authService.emailSignup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: selectedRole
      });
      
      login(result.access_token, result.user);
      toast.success(`Account created! Welcome ${result.user.name}!`);
      
      redirectByRole(result.user.role);
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.detail || 'Signup failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(formData.email);
      toast.success('Password reset link sent to your email!');
      setAuthMode('login');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    // Redirect based on role to their respective dashboards
    if (role === 'customer') {
      navigate('/customer/dashboard');
    } else if (role === 'tasker') {
      navigate('/tasker/dashboard');
    } else if (role === 'superadmin') {
      navigate('/admin/dashboard');
    }
  };

  const handleGuestLogin = () => {
    try {
      const guestUser = {
        _id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@trustedhands.com',
        role: 'customer',
        roles: ['customer'],
        isGuest: true,
        created_at: new Date().toISOString()
      };

      const guestToken = 'guest_token_' + Date.now();
      login(guestToken, guestUser);
      toast.success('Welcome, Guest! Browse our services.');
      
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 100);
    } catch (error) {
      console.error('Guest login error:', error);
      toast.error('Failed to login as guest');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const result = await authService.googleLogin(tokenResponse.access_token, selectedRole);
        login(result.access_token, result.user);
        toast.success(`Welcome ${result.user.name}!`);
        redirectByRole(result.user.role);
      } catch (error) {
        console.error('Google login error:', error);
        toast.error(error.response?.data?.detail || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error('Google login failed');
    },
  });

  return (
    <div className="login-container">
      <div className="login-box scale-in">
        <div className="login-header">
          <h1>
            <img src="/logo.png" alt="TrustedHands" style={{ width: '42px', height: '42px', objectFit: 'contain', marginRight: '10px', verticalAlign: 'middle' }} />
            {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p>
            {authMode === 'login' && 'Sign in to access your account'}
            {authMode === 'signup' && 'Join TrustedHands today'}
            {authMode === 'forgot' && 'Enter your email to reset password'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="role-selector">
          <h3>I am a:</h3>
          <div className="role-buttons">
            <button
              className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
              type="button"
            >
              <span className="role-icon">👤</span>
              <span>Customer</span>
            </button>
            <button
              className={`role-btn ${selectedRole === 'tasker' ? 'active' : ''}`}
              onClick={() => setSelectedRole('tasker')}
              type="button"
            >
              <span className="role-icon">⚡</span>
              <span>Tasker</span>
            </button>
            <button
              className={`role-btn ${selectedRole === 'superadmin' ? 'active' : ''}`}
              onClick={() => setSelectedRole('superadmin')}
              type="button"
            >
              <span className="role-icon">👑</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Email/Password Forms */}
        {authMode === 'login' && (
          <form onSubmit={handleEmailLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Sign In'}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => setAuthMode('forgot')}
            >
              Forgot Password?
            </button>
          </form>
        )}

        {authMode === 'signup' && (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password (min 6 characters)"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Create Account'}
            </button>
          </form>
        )}

        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your registered email"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'Send Reset Link'}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => setAuthMode('login')}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Mode Switcher */}
        {authMode !== 'forgot' && (
          <div className="mode-switcher">
            {authMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setAuthMode('signup')} className="switch-link">
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => setAuthMode('login')} className="switch-link">
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Google Login */}
        <button
          className="google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
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

        {/* Guest Login (Only for customers) */}
        {selectedRole === 'customer' && (
          <button
            className="guest-login-btn"
            onClick={handleGuestLogin}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <span className="guest-icon">🎭</span>
                <span>Browse as Guest</span>
              </>
            )}
          </button>
        )}

        <div className="login-footer">
          <p>
            By continuing, you agree to our{' '}
            <a href="https://trusted-hands.vercel.app/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
            <a href="https://trusted-hands.vercel.app/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
