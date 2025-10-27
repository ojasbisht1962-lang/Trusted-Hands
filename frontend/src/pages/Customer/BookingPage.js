import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceService, bookingService } from '../../services/apiService';
import { toast } from 'react-toastify';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingSpinner from '../../components/LoadingSpinner';
import './BookingPage.css';

export default function BookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const data = await serviceService.getService(serviceId);
      setService(data);
      // Pre-fill location if available
      if (data.location) {
        setBookingData(prev => ({ ...prev, location: data.location }));
      }
    } catch (error) {
      toast.error('Failed to load service details');
      navigate('/customer/services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!bookingData.scheduled_date) {
      toast.error('Please select a date');
      return;
    }
    if (!bookingData.scheduled_time) {
      toast.error('Please select a time');
      return;
    }
    if (!bookingData.location) {
      toast.error('Please enter a location');
      return;
    }

    try {
      setSubmitting(true);
      
      const booking = {
        service_id: serviceId,
        tasker_id: service.tasker_id || service.tasker?._id,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        location: bookingData.location,
        notes: bookingData.notes || '',
        total_price: parseFloat(service.price)
      };

      console.log('Submitting booking:', booking);
      await bookingService.createBooking(booking);
      
      toast.success('Booking request sent successfully! The tasker will be notified.');
      navigate('/customer/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
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

  if (!service) {
    return (
      <>
        <Navbar />
        <div className="booking-page-container">
          <div className="error-state">Service not found</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="booking-page-container">
        <div className="booking-content">
          {/* Service Info Card */}
          <div className="service-info-card">
          <div className="service-icon-large">
            {service.service_type === 'technical' ? '🔧' : '🏠'}
          </div>
          
          <h2>{service.title}</h2>
          <p className="service-description">{service.description}</p>

          <div className="service-meta">
            <div className="meta-item">
              <span className="label">Category:</span>
              <span className="value">{service.category}</span>
            </div>
            <div className="meta-item">
              <span className="label">Price:</span>
              <span className="value price">₹{service.price}</span>
            </div>
            <div className="meta-item">
              <span className="label">Price Unit:</span>
              <span className="value">{service.price_unit}</span>
            </div>
            {service.location && (
              <div className="meta-item">
                <span className="label">Service Area:</span>
                <span className="value">📍 {service.location}</span>
              </div>
            )}
          </div>

          {/* Tasker Info */}
          {service.tasker && (
            <div className="tasker-info-card">
              <div className="tasker-avatar">
                {service.tasker.profile_picture ? (
                  <img src={service.tasker.profile_picture} alt={service.tasker.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {service.tasker.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="tasker-details">
                <h4>{service.tasker.name}</h4>
                <div className="tasker-stats">
                  <span>⭐ {service.tasker.rating?.toFixed(1) || '0.0'}</span>
                  <span>• {service.tasker.total_jobs || 0} jobs</span>
                </div>
                {service.tasker.professional_badge && (
                  <span className="verified-badge">✓ Verified Professional</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="booking-form-card">
          <h2>📅 Book This Service</h2>
          <p className="form-subtitle">Fill in the details to request a booking</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Scheduled Date *</label>
              <input
                type="date"
                name="scheduled_date"
                value={bookingData.scheduled_date}
                onChange={handleInputChange}
                min={getMinDate()}
                max={getMaxDate()}
                required
              />
              <small>Select a date for the service</small>
            </div>

            <div className="form-group">
              <label>Preferred Time *</label>
              <select
                name="scheduled_time"
                value={bookingData.scheduled_time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a time slot</option>
                <option value="08:00 AM - 10:00 AM">08:00 AM - 10:00 AM</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="12:00 PM - 02:00 PM">12:00 PM - 02:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
              </select>
              <small>Choose your preferred time slot</small>
            </div>

            <div className="form-group">
              <label>Service Location *</label>
              <input
                type="text"
                name="location"
                value={bookingData.location}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                required
              />
              <small>Where should the service be performed?</small>
            </div>

            <div className="form-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                name="notes"
                value={bookingData.notes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any specific requirements or instructions..."
              />
              <small>Provide any additional details for the tasker</small>
            </div>

            <div className="price-summary">
              <div className="summary-row">
                <span>Service Price:</span>
                <span className="amount">₹{service.price}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span className="amount">₹{service.price}</span>
              </div>
              <p className="payment-note">💡 Payment will be collected after service completion</p>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/customer/services')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-confirm-booking"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '✓ Confirm Booking'}
              </button>
            </div>

            <div className="booking-info">
              <p>📌 Your booking request will be sent to the tasker for confirmation</p>
              <p>📧 You will be notified once the tasker responds</p>
            </div>
          </form>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
