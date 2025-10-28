import React, { useState, useEffect } from 'react';
import { amcService } from '../../services/apiService';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import './AMCRequest.css';

export default function AMCRequest() {
  const [amcRequests, setAmcRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    service_types: [],
    description: '',
    duration_months: 12,
    frequency: 'monthly',
    preferred_days: [],
    preferred_time: '',
    estimated_budget: ''
  });

  const serviceTypes = [
    { label: 'Cleaning', value: 'cleaning' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Security', value: 'security' },
    { label: 'Landscaping', value: 'landscaping' },
    { label: 'Electrical', value: 'electrical' },
    { label: 'Plumbing', value: 'plumbing' },
    { label: 'AC Servicing', value: 'ac_servicing' },
    { label: 'Pest Control', value: 'pest_control' },
    { label: 'Other', value: 'other' }
  ];

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-Weekly', value: 'bi-weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' }
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchAMCRequests();
  }, []);

  const fetchAMCRequests = async () => {
    try {
      setLoading(true);
      const data = await amcService.getMyAMCRequests();
      setAmcRequests(data);
    } catch (error) {
      toast.error('Failed to load AMC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (name === 'service_types') {
        const updatedServices = checked
          ? [...formData.service_types, value]
          : formData.service_types.filter(s => s !== value);
        setFormData(prev => ({ ...prev, service_types: updatedServices }));
      } else if (name === 'preferred_days') {
        const updatedDays = checked
          ? [...formData.preferred_days, value]
          : formData.preferred_days.filter(d => d !== value);
        setFormData(prev => ({ ...prev, preferred_days: updatedDays }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.service_types.length === 0) {
      toast.error('Please select at least one service type');
      return;
    }
    try {
      const submitData = {
        ...formData,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null
      };
      await amcService.createAMC(submitData);
      toast.success('AMC request submitted successfully! Our team will review it shortly.');
      setShowCreateModal(false);
      resetForm();
      fetchAMCRequests();
    } catch (error) {
      console.error('AMC creation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create AMC request');
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      service_types: [],
      description: '',
      duration_months: 12,
      frequency: 'monthly',
      preferred_days: [],
      preferred_time: '',
      estimated_budget: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      active: '#10b981',
      expired: '#6b7280',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      active: '✓',
      expired: '🕐',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingScreen />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* ...existing code... */}
      <Footer />
    </>
  );
}