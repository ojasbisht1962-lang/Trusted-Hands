import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './FavoriteButton.css';

export default function FavoriteButton({ providerId, isFavorite: initialFavorite, onToggle }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const endpoint = isFavorite 
        ? 'http://localhost:8000/api/provider-selection/favorites/remove'
        : 'http://localhost:8000/api/provider-selection/favorites/add';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider_id: providerId })
      });

      const data = await response.json();

      if (data.success || response.ok) {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? '💔 Removed from favorites' : '⭐ Added to favorites!');
        if (onToggle) onToggle(!isFavorite);
      } else {
        toast.error(data.message || 'Failed to update favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorite ? 'is-favorite' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <span className="favorite-spinner">⏳</span>
      ) : (
        <span className="favorite-icon">
          {isFavorite ? '⭐' : '☆'}
        </span>
      )}
      <span className="favorite-text">
        {isFavorite ? 'Favorited' : 'Add to Favorites'}
      </span>
    </button>
  );
}
