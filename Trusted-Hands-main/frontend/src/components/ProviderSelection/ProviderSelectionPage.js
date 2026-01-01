import React, { useState, useEffect } from 'react';
import './ProviderSelectionPage.css';
import ProviderFilters from './ProviderFilters';
import ProviderCard from './ProviderCard';
import QuickRebookModal from './QuickRebookModal';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ProviderSelectionPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    rating_min: 0,
    rating_max: 5,
    max_distance: 50,
    availability_days: 30,
    previously_hired_only: false,
    favorites_only: false,
    verified_only: false
  });
  const [sortBy, setSortBy] = useState('rating_high');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [showQuickRebook, setShowQuickRebook] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.warning('Location access denied. Distance sorting may not work accurately.');
        }
      );
    }
  }, []);

  // Fetch providers when filters, sorting, or pagination changes
  useEffect(() => {
    if (currentLocation) {
      fetchProviders();
    }
  }, [filters, sortBy, pagination.page, currentLocation]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const requestData = {
        current_location: currentLocation,
        filters: filters,
        sort_by: sortBy,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await api.post('/provider-selection/search', requestData);
      
      setProviders(response.data.providers || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        pages: response.data.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load providers. Please try again.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on sort change
  };

  const handleToggleFavorite = async (providerId) => {
    try {
      const provider = providers.find(p => p._id === providerId);
      const isFavorite = provider?.is_favorite;

      if (isFavorite) {
        await api.post('/provider-selection/favorites/remove', { provider_id: providerId });
        toast.success('Removed from favorites');
      } else {
        await api.post('/provider-selection/favorites/add', { provider_id: providerId });
        toast.success('Added to favorites');
      }

      // Update local state
      setProviders(prev => 
        prev.map(p => 
          p._id === providerId 
            ? { ...p, is_favorite: !isFavorite }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleQuickRebook = (provider) => {
    setSelectedProvider(provider);
    setShowQuickRebook(true);
  };

  const handleQuickRebookComplete = () => {
    setShowQuickRebook(false);
    setSelectedProvider(null);
    toast.success('Booking created successfully!');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="provider-selection-page">
      <div className="page-header">
        <h1>Find Your Perfect Service Provider</h1>
        <p className="subtitle">
          Browse from {pagination.total} providers • Sort by rating, distance, availability & more
        </p>
      </div>

      <div className="page-content">
        <aside className="filters-sidebar">
          <ProviderFilters
            filters={filters}
            sortBy={sortBy}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
        </aside>

        <main className="providers-main">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">⏳</div>
              <p>Finding the best providers for you...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="no-providers">
              <div className="no-providers-icon">🔍</div>
              <h2>No Providers Found</h2>
              <p>Try adjusting your filters or search criteria</p>
              <button 
                className="reset-filters-btn"
                onClick={() => handleFilterChange({
                  rating_min: 0,
                  rating_max: 5,
                  max_distance: 50,
                  availability_days: 30,
                  previously_hired_only: false,
                  favorites_only: false,
                  verified_only: false
                })}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="providers-grid">
                {providers.map(provider => (
                  <ProviderCard
                    key={provider._id}
                    provider={provider}
                    onQuickRebook={handleQuickRebook}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {showQuickRebook && selectedProvider && (
        <QuickRebookModal
          provider={selectedProvider}
          onClose={() => setShowQuickRebook(false)}
          onComplete={handleQuickRebookComplete}
        />
      )}
    </div>
  );
};

export default ProviderSelectionPage;
