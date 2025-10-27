import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/apiService';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setTimeout(() => setLoading(false), 800);
  }, []);

  const login = (token, userData) => {
    authService.setAuth(token, userData);
    setToken(token);
    setUser(userData);
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
    const response = await authService.switchRole(newRole);
    if (response.access_token) {
      authService.setAuth(response.access_token, response.user);
      setToken(response.access_token);
      setUser(response.user);
      return response;
    }
    throw new Error('Role switch failed');
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
