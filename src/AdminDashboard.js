import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiFilm, FiClock, FiEdit2, FiTrash2, FiPlus, FiLogOut, FiCalendar, FiHome, FiDollarSign, FiGrid } from 'react-icons/fi';
import './AdminDashboard.css';

// Використовуємо той самий API_URL, що і в інших компонентах
const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

// Зберігаємо URL в localStorage для інших компонентів
localStorage.setItem('apiUrl', API_URL);

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('movies'); // movies or showtimes or halls
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    console.log('Current tab from URL:', tab);
    if (tab === 'showtimes' || tab === 'movies' || tab === 'halls') {
      setActiveTab(tab);
    }
  }, [location.search]);

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

    if (activeTab === 'movies') {
      fetchMovies();
    } else if (activeTab === 'showtimes') {
      fetchShowtimes();
    } else if (activeTab === 'halls') {
      fetchHalls();
    }
  }, [navigate, activeTab]);

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (isAuthenticated && userRole === 'admin') {
      console.log('Refreshing admin dashboard data...');
      setIsLoading(true);
      
      if (activeTab === 'movies') {
        fetchMovies();
      } else if (activeTab === 'showtimes') {
        fetchShowtimes();
      } else if (activeTab === 'halls') {
        fetchHalls();
      }
    }
  }, [location.pathname]);

  const fetchShowtimes = async () => {
    try {
      console.log('Fetching showtimes...');
      
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
        throw new Error(`Failed to fetch showtimes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} showtimes`);
      setShowtimes(data);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError(`Failed to load showtimes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      console.log('Fetching movies for admin dashboard...');
      
      const token = localStorage.getItem('token');
      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/movies`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} movies for admin dashboard`);
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(`Failed to load movies: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHalls = async () => {
    try {
      console.log('Fetching halls...');
      
      const token = localStorage.getItem('token');
      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/halls`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch halls: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} halls`);
      setHalls(data);
    } catch (error) {
      console.error('Error fetching halls:', error);
      setError(`Failed to load halls: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`);
  };

  const handleAddMovie = () => {
    navigate('/admin/movie');
  };

  const handleAddShowtime = () => {
    navigate('/admin/showtime');
  };

  const handleAddHall = () => {
    navigate('/admin/hall');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleDeleteConfirm = async (type, id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      if (type === 'movies') {
        await fetchMovies();
      } else if (type === 'showtimes') {
        await fetchShowtimes();
      } else if (type === 'halls') {
        await fetchHalls();
      }

      setDeleteConfirm(null);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setError(`Failed to delete ${type}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="admin-dashboard">
      <motion.div 
        className="admin-sidebar"
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'movies' ? 'active' : ''}`} 
            onClick={() => handleTabChange('movies')}
          >
            <FiFilm />
            <span>Movies</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'showtimes' ? 'active' : ''}`} 
            onClick={() => handleTabChange('showtimes')}
          >
            <FiClock />
            <span>Showtimes</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'halls' ? 'active' : ''}`} 
            onClick={() => handleTabChange('halls')}
          >
            <FiGrid />
            <span>Halls</span>
          </button>

          <button 
            className="nav-item"
            onClick={() => navigate('/admin/analytics')}
          >
            <FiDollarSign />
            <span>Sales Analytics</span>
          </button>
          
          <button 
            className="nav-item"
            onClick={() => navigate('/')}
          >
            <FiHome />
            <span>Client Area</span>
          </button>
          
          <button className="nav-item logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </motion.div>

      <div className="admin-main">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              className="loading-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading {activeTab}...
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="section-header">
                <motion.h1 
                  className="dashboard-title"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                >
                  {activeTab === 'movies' ? 'Movies' : activeTab === 'showtimes' ? 'Showtimes' : 'Halls'}
                </motion.h1>
                
                {activeTab === 'movies' && (
                  <motion.button
                    className="add-button"
                    onClick={handleAddMovie}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus />
                    Add New Movie
                  </motion.button>
                )}
                
                {activeTab === 'showtimes' && (
                  <motion.button
                    className="add-button"
                    onClick={handleAddShowtime}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus />
                    Add New Showtime
                  </motion.button>
                )}
                
                {activeTab === 'halls' && (
                  <motion.button
                    className="add-button"
                    onClick={handleAddHall}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiPlus />
                    Add New Hall
                  </motion.button>
                )}
              </div>

              {activeTab === 'movies' ? (
                <div className="movies-grid">
                  {movies.length > 0 ? movies.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      className="movie-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="movie-poster-container">
                        <img 
                          src={movie.image ? `${API_URL}${movie.image}` : '/placeholder-movie.jpg'}
                          alt={movie.title}
                          className="movie-poster"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-movie.jpg';
                          }}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                        <div className="movie-actions-overlay">
                          <motion.button
                            className="edit-button"
                            onClick={() => navigate(`/admin/movie/edit/${movie.id}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiEdit2 />
                          </motion.button>
                          <motion.button
                            className="delete-button"
                            onClick={() => setDeleteConfirm({ type: 'movies', id: movie.id })}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiTrash2 />
                          </motion.button>
                        </div>
                      </div>
                      <div className="movie-details">
                        <h3 title={movie.title}>
                          {movie.title}
                        </h3>
                        <div className="movie-meta">
                          <span className="movie-duration">
                            <FiClock />
                            {movie.durationInMinutes} min
                          </span>
                          {movie.genre && (
                            <span className="movie-genre">
                              <span>{movie.genre.split(',')[0]}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="empty-state">
                      <p>No movies available. Add your first movie!</p>
                      <motion.button
                        className="empty-state-button"
                        onClick={handleAddMovie}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiPlus />
                        Add Movie
                      </motion.button>
                    </div>
                  )}
                </div>
              ) : activeTab === 'showtimes' ? (
                <div className="showtimes-grid">
                  {showtimes.map((showtime, index) => (
                    <motion.div
                      key={showtime.id}
                      className="showtime-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="showtime-header">
                        <h3>{showtime.movie?.title}</h3>
                        <div className="showtime-actions">
                          <motion.button
                            className="edit-button"
                            onClick={() => navigate(`/admin/showtime/edit/${showtime.id}`)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiEdit2 />
                          </motion.button>
                          <motion.button
                            className="delete-button"
                            onClick={() => setDeleteConfirm({ type: 'showtimes', id: showtime.id })}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiTrash2 />
                          </motion.button>
                        </div>
                      </div>
                      <div className="showtime-details">
                        <p className="showtime-datetime">
                          <FiCalendar />
                          {new Date(showtime.startTime).toLocaleString()}
                        </p>
                        <p className="showtime-hall">
                          <FiHome />
                          {showtime.hall?.name || `Hall ${showtime.hallId}`}
                        </p>
                        <p className="showtime-price">
                          <FiDollarSign />
                          ${showtime.price.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="halls-grid">
                  {halls.map((hall, index) => (
                    <motion.div
                      key={hall.id}
                      className="hall-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="hall-header">
                        <h3>{hall.name}</h3>
                        <div className="hall-actions">
                          <motion.button
                            className="edit-button"
                            onClick={() => navigate(`/admin/hall/edit/${hall.id}`)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiEdit2 />
                          </motion.button>
                          <motion.button
                            className="delete-button"
                            onClick={() => setDeleteConfirm({ type: 'halls', id: hall.id })}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FiTrash2 />
                          </motion.button>
                        </div>
                      </div>
                      <div className="hall-details">
                        <p className="hall-info">
                          <FiGrid />
                          {hall.rows} rows × {hall.seatsPerRow} seats
                        </p>
                        <p className="hall-capacity">
                          Total Capacity: {hall.rows * hall.seatsPerRow} seats
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {deleteConfirm && (
          <motion.div
            className="delete-confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="delete-confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Confirm Delete</h3>
              <p>
                {deleteConfirm.type === 'halls' 
                  ? 'Are you sure you want to delete this hall? This action cannot be undone.'
                  : `Are you sure you want to delete this ${deleteConfirm.type.slice(0, -1)}?`}
              </p>
              <div className="delete-confirm-actions">
                <motion.button
                  className="cancel-button"
                  onClick={() => setDeleteConfirm(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="delete-button"
                  onClick={() => handleDeleteConfirm(deleteConfirm.type, deleteConfirm.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 