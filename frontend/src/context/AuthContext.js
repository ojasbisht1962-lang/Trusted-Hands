import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/apiService';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      console.log('AuthProvider - Loaded user:', storedUser);
      console.log('AuthProvider - Profile picture:', storedUser?.profile_picture);
    }
    
    // Simulate a brief loading period for smooth transition
    setTimeout(() => setLoading(false), 800);
  }, []);

  const login = (token, userData) => {
    console.log('AuthContext login called with:', { token: token ? 'exists' : 'missing', userData });
    authService.setAuth(token, userData);
    setToken(token);
    setUser(userData);
    console.log('AuthContext state updated');
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const switchRole = async (newRole) => {
    try {
      const response = await authService.switchRole(newRole);
      if (response.access_token) {
        authService.setAuth(response.access_token, response.user);
        setToken(response.access_token);
        setUser(response.user);
        return response;
      }
    } catch (error) {
      console.error('Role switch failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    switchRole,
    isAuthenticated: !!token,
    isCustomer: user?.role === 'customer',
    isTasker: user?.role === 'tasker',
    isSuperAdmin: user?.role === 'superadmin',
    hasMultipleRoles: user?.roles?.length > 1,
    availableRoles: user?.roles || [],
  };

  if (loading) {
    return <LoadingScreen message="🚀 Initializing TrustedHands..." />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
