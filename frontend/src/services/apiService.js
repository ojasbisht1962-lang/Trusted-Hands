import api from './api';

export const authService = {
  googleLogin: async (token, role) => {
    const response = await api.post('/auth/google-login', { token, role });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('access_token');
  },

  setAuth: (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  completeTaskerProfile: async (data) => {
    const response = await api.post('/users/tasker/complete-profile', data);
    return response.data;
  },

  getTaskers: async (params) => {
    const response = await api.get('/users/taskers', { params });
    return response.data;
  },

  getTaskerDetails: async (taskerId) => {
    const response = await api.get(`/users/taskers/${taskerId}`);
    return response.data;
  },
};

export const serviceService = {
  createService: async (data) => {
    const response = await api.post('/services/', data);
    return response.data;
  },

  getServices: async (params) => {
    const response = await api.get('/services/', { params });
    return response.data;
  },

  getMyServices: async () => {
    const response = await api.get('/services/my-services');
    return response.data;
  },

  getService: async (serviceId) => {
    const response = await api.get(`/services/${serviceId}`);
    return response.data;
  },

  updateService: async (serviceId, data) => {
    const response = await api.put(`/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await api.delete(`/services/${serviceId}`);
    return response.data;
  },
};

export const bookingService = {
  createBooking: async (data) => {
    const response = await api.post('/bookings/', data);
    return response.data;
  },

  getMyBookings: async (status) => {
    const response = await api.get('/bookings/my-bookings', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getBooking: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  updateBookingStatus: async (bookingId, status) => {
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  rateBooking: async (bookingId, rating, review) => {
    const response = await api.post(`/bookings/${bookingId}/rate`, { rating, review });
    return response.data;
  },
};

export const chatService = {
  sendMessage: async (recipientId, content) => {
    const response = await api.post('/chat/send', { recipient_id: recipientId, content });
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getChat: async (chatId) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },

  deleteChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  },
};

export const notificationService = {
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const response = await api.get('/notifications/', {
      params: { unread_only: unreadOnly, limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export const amcService = {
  createAMC: async (data) => {
    const response = await api.post('/amc/', data);
    return response.data;
  },

  getMyAMCRequests: async () => {
    const response = await api.get('/amc/my-requests');
    return response.data;
  },

  getAllAMCRequests: async (status) => {
    const response = await api.get('/amc/all', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getAMCRequest: async (amcId) => {
    const response = await api.get(`/amc/${amcId}`);
    return response.data;
  },

  updateAMCStatus: async (amcId, data) => {
    const response = await api.put(`/amc/${amcId}/status`, data);
    return response.data;
  },
};

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getPendingVerifications: async () => {
    const response = await api.get('/admin/taskers/pending-verification');
    return response.data;
  },

  updateVerificationStatus: async (taskerId, status, notes) => {
    const response = await api.put(`/admin/taskers/${taskerId}/verification`, {
      status,
      notes,
    });
    return response.data;
  },

  blockUser: async (userId, reason) => {
    const response = await api.put(`/admin/users/${userId}/block`, { reason });
    return response.data;
  },

  unblockUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unblock`);
    return response.data;
  },

  getPriceRanges: async () => {
    const response = await api.get('/admin/price-ranges');
    return response.data;
  },

  createPriceRange: async (data) => {
    const response = await api.post('/admin/price-ranges', data);
    return response.data;
  },

  deletePriceRange: async (category) => {
    const response = await api.delete(`/admin/price-ranges/${category}`);
    return response.data;
  },

  getAllBookings: async (params) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },

  getAllServices: async () => {
    const response = await api.get('/admin/services');
    return response.data;
  },
};
