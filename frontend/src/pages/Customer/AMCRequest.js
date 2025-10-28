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
        <LoadingScreen message="Loading AMC Requests..." />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="amc-request-page">
        <div className="amc-header">
          <h2>My AMC Requests</h2>
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            + Create New AMC Request
          </button>
        </div>
        <div className="amc-list">
          {amcRequests.length === 0 ? (
            <div className="empty-list">No AMC requests found.</div>
          ) : (
            <table className="amc-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Services</th>
                  <th>Budget</th>
                  <th>Duration</th>
                  <th>Frequency</th>
                  <th>Preferred Days</th>
                  <th>Preferred Time</th>
                </tr>
              </thead>
              <tbody>
                {amcRequests.map((req, idx) => (
                  <tr key={idx} style={{ background: '#fff' }}>
                    <td style={{ color: getStatusColor(req.status), fontWeight: 700 }}>
                      {getStatusIcon(req.status)} {req.status}
                    </td>
                    <td>{req.company_name}</td>
                    <td>{req.contact_person} <br /> {req.contact_email} <br /> {req.contact_phone}</td>
                    <td>{Array.isArray(req.service_types) ? req.service_types.join(', ') : req.service_types}</td>
                    <td>{req.estimated_budget ? `₹${req.estimated_budget}` : '-'}</td>
                    <td>{req.duration_months} months</td>
                    <td>{req.frequency}</td>
                    <td>{Array.isArray(req.preferred_days) ? req.preferred_days.join(', ') : req.preferred_days}</td>
                    <td>{req.preferred_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create AMC Request</h3>
              <form onSubmit={handleSubmit} className="amc-form">
                <label>
                  Company Name
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} required />
                </label>
                <label>
                  Contact Person
                  <input type="text" name="contact_person" value={formData.contact_person} onChange={handleInputChange} required />
                </label>
                <label>
                  Contact Email
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleInputChange} required />
                </label>
                <label>
                  Contact Phone
                  <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleInputChange} required />
                </label>
                <label>
                  Address
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
                </label>
                <label>
                  Service Types
                  <div className="checkbox-group">
                    {serviceTypes.map(st => (
                      <label key={st.value} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="service_types"
                          value={st.value}
                          checked={formData.service_types.includes(st.value)}
                          onChange={handleInputChange}
                        />
                        {st.label}
                      </label>
                    ))}
                  </div>
                </label>
                <label>
                  Description
                  <textarea name="description" value={formData.description} onChange={handleInputChange} />
                </label>
                <label>
                  Duration (months)
                  <input type="number" name="duration_months" value={formData.duration_months} onChange={handleInputChange} min={1} max={60} />
                </label>
                <label>
                  Frequency
                  <select name="frequency" value={formData.frequency} onChange={handleInputChange}>
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred Days
                  <div className="checkbox-group">
                    {daysOfWeek.map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="preferred_days"
                          value={day}
                          checked={formData.preferred_days.includes(day)}
                          onChange={handleInputChange}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </label>
                <label>
                  Preferred Time
                  <input type="text" name="preferred_time" value={formData.preferred_time} onChange={handleInputChange} placeholder="e.g. 10:00 AM - 12:00 PM" />
                </label>
                <label>
                  Estimated Budget (₹)
                  <input type="number" name="estimated_budget" value={formData.estimated_budget} onChange={handleInputChange} min={0} step={0.01} />
                </label>
                <div className="modal-actions">
                  <button type="submit" className="btn-submit">Submit</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}