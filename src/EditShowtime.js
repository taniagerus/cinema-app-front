import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiMonitor, FiHome } from 'react-icons/fi';
import './AdminShowtime.css';

const API_URL = 'http://localhost:5252';

function EditShowtime() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [price, setPrice] = useState('15.00');
  const [endTime, setEndTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);

  // Завантаження даних сеансу
  useEffect(() => {
    const fetchShowtime = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authorization required');
        }

        let authToken = token.trim();
        if (!authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}/api/showtimes/${id}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch showtime');
        }

        const data = await response.json();
        
        // Встановлюємо значення полів
        setSelectedMovie(data.movieId.toString());
        setSelectedHall(data.hallId.toString());
        setPrice(data.price.toFixed(2));

        // Розбираємо дату і час
        const startDate = new Date(data.startTime);
        setSelectedDate(startDate.toISOString().split('T')[0]);
        setSelectedTime(startDate.toTimeString().slice(0, 5));

        const endDateTime = new Date(data.endTime);
        setEndDate(endDateTime.toISOString().split('T')[0]);
        setEndTime(endDateTime.toTimeString().slice(0, 5));

      } catch (error) {
        console.error('Error fetching showtime:', error);
        setError('Failed to load showtime data');
        navigate('/admin');
      }
    };

    // Завантаження фільмів
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${API_URL}/api/movies`);
        if (!response.ok) {
          throw new Error('Failed to load movies');
        }
        const data = await response.json();
        setMovies(data);
      } catch (error) {
        console.error('Error loading movies:', error);
        setError('Failed to load movies');
      }
    };

    // Завантаження залів
    const fetchHalls = async () => {
      try {
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
          throw new Error('Failed to load halls');
        }

        const data = await response.json();
        setHalls(data);
      } catch (error) {
        console.error('Error loading halls:', error);
        setError('Failed to load halls');
      }
    };

    Promise.all([fetchShowtime(), fetchMovies(), fetchHalls()])
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  // Розрахунок часу завершення сеансу
  const calculateEndDateTime = (date, time, movieId) => {
    if (!date || !time || !movieId) return { endTime: '', endDate: '' };

    const movie = movies.find(m => m.id === parseInt(movieId));
    if (!movie) return { endTime: '', endDate: '' };
    
    const durationInMinutes = movie.durationInMinutes || 120;
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + durationInMinutes * 60000);
    
    return {
      endTime: endDateTime.toTimeString().slice(0, 5),
      endDate: endDateTime.toISOString().split('T')[0]
    };
  };

  // Оновлення часу закінчення при зміні вхідних даних
  useEffect(() => {
    if (selectedMovie && selectedDate && selectedTime) {
      const { endTime: calculatedEndTime, endDate: calculatedEndDate } = 
        calculateEndDateTime(selectedDate, selectedTime, selectedMovie);
      setEndTime(calculatedEndTime);
      setEndDate(calculatedEndDate);
    }
  }, [selectedMovie, selectedDate, selectedTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization required');
      }

      const startDateTime = `${selectedDate}T${selectedTime}:00`;
      const endDateTime = `${endDate}T${endTime}:00`;
      
      const showtimeData = {
        id: parseInt(id),
        movieId: parseInt(selectedMovie),
        hallId: parseInt(selectedHall),
        startTime: startDateTime,
        endTime: endDateTime,
        price: parseFloat(price)
      };

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/showtimes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(showtimeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update showtime');
      }

      setSuccess('Showtime updated successfully!');
      
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      console.error('Error updating showtime:', error);
      setError(error.message || 'Error updating showtime');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="loading-message">Loading showtime data...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <motion.div 
          className="admin-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button 
            className="back-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
          >
            <FiArrowLeft />
          </motion.button>
          <h1>Edit Showtime</h1>
        </motion.div>
        
        <motion.form 
          className="admin-content"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="form-group">
            <label>
              <FiMonitor className="input-icon" />
              Movie
            </label>
            <select 
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              required
              className="admin-select"
            >
              <option value="">Select a movie</option>
              {movies.map(movie => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} ({movie.durationInMinutes}min)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <FiHome className="input-icon" />
              Hall
            </label>
            <select 
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              required
              className="admin-select"
            >
              <option value="">Select a hall</option>
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name || `Hall ${hall.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <FiCalendar className="input-icon" />
              Show Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <label>
              <FiClock className="input-icon" />
              Show Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
              className="admin-input"
            />
          </div>

          {selectedMovie && selectedDate && selectedTime && endTime && (
            <div className="form-group">
              <label style={{ color: '#666' }}>
                <FiClock className="input-icon" />
                End Time
              </label>
              <div className="end-time-display" style={{
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                color: '#333',
                fontSize: '0.9rem'
              }}>
                {endDate === selectedDate ? (
                  `Ends at: ${endTime}`
                ) : (
                  `Ends at: ${endTime} (next day)`
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              Ticket Price ($)
            </label>
            <div className="price-input-container">
              <button
                type="button"
                onClick={() => setPrice((prev) => Math.max(0, parseFloat(prev) - 1).toFixed(2))}
                className="price-button"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0) {
                    setPrice(value.toFixed(2));
                  }
                }}
                required
                className="admin-input price-input"
              />
              <button
                type="button"
                onClick={() => setPrice((prev) => (parseFloat(prev) + 1).toFixed(2))}
                className="price-button"
              >
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ 
              color: '#d32f2f', 
              backgroundColor: '#fdecea', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ 
              color: '#2e7d32', 
              backgroundColor: '#edf7ed', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #c3e6cb'
            }}>
              {success}
            </div>
          )}

          <div className="admin-actions">
            <motion.button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              CANCEL
            </motion.button>
            
            <motion.button
              type="submit"
              className="submit-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 'SAVING...' : 'SAVE'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default EditShowtime; 