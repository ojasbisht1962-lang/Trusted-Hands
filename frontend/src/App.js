import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import config from './config';
import './styles/App.css';

// Common Pages
import Login from './pages/Common/Login';
import Home from './pages/Common/Home';
import About from './pages/Common/About';
import FAQ from './pages/Common/FAQ';
import Contact from './pages/Common/Contact';
import PrivacyPolicy from './pages/Common/PrivacyPolicy';
import TermsOfService from './pages/Common/TermsOfService';

// Customer Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import CustomerProfile from './pages/Customer/CustomerProfile';
import Services from './pages/Customer/Services';
import ServiceDetails from './pages/Customer/ServiceDetails';
import TaskersList from './pages/Customer/TaskersList';
import TaskerDetails from './pages/Customer/TaskerDetails';
import BookingPage from './pages/Customer/BookingPage';
import MyBookings from './pages/Customer/MyBookings';
import Chat from './pages/Customer/Chat';
import AMCRequest from './pages/Customer/AMCRequest';

// Tasker Pages
import TaskerDashboard from './pages/Tasker/Dashboard';
import TaskerProfile from './pages/Tasker/Profile';
import TaskerOnboarding from './pages/Tasker/Onboarding';
import MyServices from './pages/Tasker/MyServices';
import TaskerBookings from './pages/Tasker/Bookings';
import TaskerChat from './pages/Tasker/Chat';

// SuperAdmin Pages
import AdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminProfile from './pages/SuperAdmin/SuperAdminProfile';
import UserManagement from './pages/SuperAdmin/UserManagement';
import VerificationManagement from './pages/SuperAdmin/VerificationManagement';
import PriceRangeManagement from './pages/SuperAdmin/PriceRangeManagement';
import AMCManagement from './pages/SuperAdmin/AMCManagement';
import BookingManagement from './pages/SuperAdmin/BookingManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    loading, 
    userRole: user?.role, 
    allowedRoles 
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log('Role not allowed, redirecting to home. User role:', user?.role, 'Allowed:', allowedRoles);
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Customer Routes */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/services"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/services/:serviceId"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ServiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/taskers"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <TaskersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/taskers/:taskerId"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <TaskerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/book/:serviceId"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/bookings"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/chat"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/chat/:chatId"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/amc"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <AMCRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        {/* Tasker Routes */}
        {/* Tasker Routes */}
        <Route
          path="/tasker/onboarding"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/dashboard"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/profile"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/services"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <MyServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/bookings"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/chat"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasker/chat/:chatId"
          element={
            <ProtectedRoute allowedRoles={['tasker']}>
              <TaskerChat />
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verifications"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <VerificationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/price-ranges"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <PriceRangeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <BookingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/amc"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AMCManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/profile"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={config.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
