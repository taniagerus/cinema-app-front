import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiFilm, FiClock, FiEdit2, FiTrash2, FiPlus, FiLogOut } from 'react-icons/fi';
import './AdminDashboard.css';

const API_URL = 'http://localhost:5252';

function AdminDashboard() {
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('token');

    if (!isAuthenticated || !token || userRole !== 'admin') {
      console.log('Authentication failed in Admin Dashboard, redirecting to login');
      localStorage.clear();
      navigate('/login');
      return;
    }

    fetchShowtimes();
  }, [navigate]);

  const fetchShowtimes = async () => {
    try {
      const token = localStorage.getItem('token');
      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/showtimes`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch showtimes');
      }

      const data = await response.json();
      setShowtimes(data);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError('Failed to load showtimes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Are you sure you want to delete this showtime?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/showtimes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete showtime');
      }

      // Оновлюємо список сеансів після видалення
      fetchShowtimes();
    } catch (error) {
      console.error('Error deleting showtime:', error);
      setError('Failed to delete showtime');
    }
  };

  const handleEditShowtime = (id) => {
    navigate(`/admin/showtime/edit/${id}`);
  };

  const handleAddShowtime = () => {
    navigate('/admin/showtime');
  };

  const handleAddMovie = () => {
    navigate('/admin/movie');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="admin-dashboard">
      <motion.div 
        className="admin-sidebar"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-logo">
          <h1>CINEMATIX</h1>
          <p>Admin Panel</p>
        </div>

        <div className="admin-actions">
          <motion.button
            className="action-button"
            onClick={handleAddMovie}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiFilm />
            Add Movie
          </motion.button>

          <motion.button
            className="action-button"
            onClick={handleAddShowtime}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus />
            Add Showtime
          </motion.button>
        </div>
        
        <motion.button 
          className="logout-button"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLogOut />
          Logout
        </motion.button>
      </motion.div>

      <div className="admin-main">
        <motion.h1 
          className="dashboard-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Current Showtimes
        </motion.h1>

        {isLoading ? (
          <div className="loading-message">Loading showtimes...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <motion.div 
            className="showtimes-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {showtimes.map((showtime, index) => (
              <motion.div
                key={showtime.id}
                className="showtime-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="showtime-header">
                  <h3>{showtime.movie?.title}</h3>
                  <div className="showtime-actions">
                    <motion.button
                      className="edit-button"
                      onClick={() => handleEditShowtime(showtime.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiEdit2 />
                    </motion.button>
                    <motion.button
                      className="delete-button"
                      onClick={() => handleDeleteShowtime(showtime.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FiTrash2 />
                    </motion.button>
                  </div>
                </div>
                
                <div className="showtime-details">
                  <p>
                    <FiClock className="icon" />
                    {formatDateTime(showtime.startTime)}
                  </p>
                  <p>Hall: {showtime.hall?.name || `Hall ${showtime.hallId}`}</p>
                  <p>Price: ${showtime.price.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 