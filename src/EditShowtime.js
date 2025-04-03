import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiMonitor, FiHome } from 'react-icons/fi';
import './AdminShowtime.css';

const API_URL = 'http://localhost:5252';

function EditShowtime() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  
  // Додаємо ref для відстеження стану компонента
  const isMounted = useRef(true);
  const isNavigatingRef = useRef(false);
  const initialLoadCompleted = useRef(false);
  
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

  // Відслідковуємо розмонтування компонента
  useEffect(() => {
    console.log('EditShowtime component mounted');
    isMounted.current = true;
    
    // Початкове завантаження даних
    const loadInitialData = async () => {
      console.log('Starting initial data load');
      if (initialLoadCompleted.current) {
        console.log('Initial load already completed, skipping');
        return;
      }
      
      try {
        // Спочатку завантажуємо дані про фільми та зали
        await Promise.all([
          fetchMovies(),
          fetchHalls()
        ]);
        
        // Далі завантажуємо дані про конкретний сеанс
        if (isMounted.current && id) {
          await fetchShowtime();
        }
        
        initialLoadCompleted.current = true;
      } catch (error) {
        console.error('Failed to load initial data:', error);
        if (isMounted.current) {
          setError(`Failed to load data: ${error.message}`);
          setIsLoading(false);
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      console.log('EditShowtime component unmounting');
      isMounted.current = false;
    };
  }, [id]); // Залежність лише від id
  
  // Безпечна навігація
  const safeNavigate = useCallback((path) => {
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring');
      return;
    }
    
    console.log(`Navigating to: ${path}`);
    isNavigatingRef.current = true;
    navigate(path);
  }, [navigate]);

  // Завантаження даних сеансу
  const fetchShowtime = async () => {
    if (!id) {
      console.error("No showtime ID provided");
      if (isMounted.current) {
        setError("Showtime ID is missing");
        setIsLoading(false);
      }
      return false;
    }
    
    try {
      console.log(`Fetching showtime data for ID: ${id}`);
      
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

      // Перевірка чи компонент все ще активний
      if (!isMounted.current) return false;

      if (!response.ok) {
        // Якщо сервер повертає помилку, отримуємо інформацію про неї
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch showtime: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Showtime data received:', data);
      
      // Ще раз перевіряємо чи компонент активний
      if (!isMounted.current) return false;
      
      // Перевіряємо наявність фільму і додаємо його до списку, якщо він відсутній
      const movieId = data.movieId;
      const movieExists = movies.some(movie => movie.id === movieId);
      
      if (!movieExists) {
        // Якщо фільм відсутній у списку, спробуємо завантажити його окремо
        console.warn(`Movie with ID ${movieId} not found in current list. Attempting to fetch it specifically.`);
        
        try {
          const movieResponse = await fetch(`${API_URL}/api/movies/${movieId}`);
          
          if (movieResponse.ok) {
            const movieData = await movieResponse.json();
            console.log(`Successfully fetched individual movie: `, movieData);
            
            // Додаємо фільм до списку, якщо він відсутній
            if (isMounted.current) {
              setMovies(prevMovies => {
                // Перевіряємо, чи фільм не додали за цей час
                if (prevMovies.some(m => m.id === movieId)) {
                  return prevMovies;
                }
                return [...prevMovies, movieData];
              });
            }
          } else {
            console.error(`Failed to fetch individual movie with ID ${movieId}`);
          }
        } catch (movieError) {
          console.error(`Error fetching individual movie:`, movieError);
        }
      }

      // Встановлюємо значення полів
      if (isMounted.current) {
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
        
        // Позначаємо, що завантаження завершено
        setIsLoading(false);
      }

      return true;
    } catch (error) {
      console.error('Error fetching showtime:', error);
      if (isMounted.current) {
        setError(`Failed to load showtime data: ${error.message}`);
        setIsLoading(false);
      }
      return false;
    }
  };

  // Завантаження фільмів
  const fetchMovies = async () => {
    try {
      console.log('Fetching movies for showtime edit');
      
      const response = await fetch(`${API_URL}/api/movies`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Movies API error response:', errorText);
        throw new Error(`Failed to load movies: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid movies data format:', data);
        throw new Error('Invalid movies data format returned from API');
      }
      
      console.log(`Loaded ${data.length} movies for showtime edit`);
      
      if (isMounted.current) {
        setMovies(data);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading movies:', error);
      if (isMounted.current) {
        setError(`Failed to load movies: ${error.message}`);
      }
      return false;
    }
  };

  // Завантаження залів
  const fetchHalls = async () => {
    try {
      console.log('Fetching halls for showtime edit');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization required to fetch halls');
      }
      
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
        const errorText = await response.text();
        console.error('Halls API error response:', errorText);
        throw new Error(`Failed to load halls: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid halls data format:', data);
        throw new Error('Invalid halls data format returned from API');
      }
      
      console.log(`Loaded ${data.length} halls for showtime edit`);
      
      if (isMounted.current) {
        setHalls(data);
      }
      
      return true;
    } catch (error) {
      console.error('Error loading halls:', error);
      if (isMounted.current) {
        setError(`Failed to load halls: ${error.message}`);
      }
      return false;
    }
  };

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
    if (selectedMovie && selectedDate && selectedTime && movies.length > 0) {
      const { endTime: calculatedEndTime, endDate: calculatedEndDate } = 
        calculateEndDateTime(selectedDate, selectedTime, selectedMovie);
      
      if (isMounted.current) {
        setEndTime(calculatedEndTime);
        setEndDate(calculatedEndDate);
      }
    }
  }, [selectedMovie, selectedDate, selectedTime, movies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Відразу перевіряємо, чи не відбувається вже навігація
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring submit');
      return;
    }
    
    if (isMounted.current) {
      setError('');
      setSuccess('');
      setIsLoading(true);
    }

    try {
      console.log('Updating showtime...');
      
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

      if (!isMounted.current) return;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.title || 'Failed to update showtime');
        } catch (jsonError) {
          throw new Error(`Error updating showtime: ${response.status} - ${errorText || 'Failed to update showtime'}`);
        }
      }

      console.log('Showtime updated successfully');
      
      if (isMounted.current) {
        setSuccess('Showtime updated successfully!');
        setIsLoading(false);
        
        // Запобігаємо повторній навігації
        console.log('Setting up navigation timeout after successful update');
        
        // Позначаємо, що ми почали перенаправлення
        isNavigatingRef.current = true;
        
        // Використовуємо setTimeout замість повернення функції з useEffect
        setTimeout(() => {
          if (isMounted.current) {
            console.log('Navigating to admin dashboard after saving');
            navigate('/admin?tab=showtimes');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating showtime:', error);
      if (isMounted.current) {
        setError(error.message || 'Error updating showtime');
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    // Запобігаємо подвійній навігації
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring cancel');
      return;
    }
    
    console.log('Cancelling showtime edit, navigating to admin dashboard');
    isNavigatingRef.current = true;
    navigate('/admin?tab=showtimes');
  };

  // Оновлена функція для повторного завантаження даних
  const handleRetry = () => {
    console.log('Retrying data load...');
    initialLoadCompleted.current = false;
    setIsLoading(true);
    
    // Початкове завантаження даних
    const loadInitialData = async () => {
      try {
        // Спочатку завантажуємо дані про фільми та зали
        await Promise.all([
          fetchMovies(),
          fetchHalls()
        ]);
        
        // Далі завантажуємо дані про конкретний сеанс
        if (isMounted.current && id) {
          await fetchShowtime();
        }
        
        initialLoadCompleted.current = true;
      } catch (error) {
        console.error('Failed to retry data load:', error);
        if (isMounted.current) {
          setError(`Failed to load data: ${error.message}`);
          setIsLoading(false);
        }
      }
    };
    
    loadInitialData();
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="loading-message">Loading showtime data...</div>
      </div>
    );
  }

  // Якщо є помилка без даних для відображення форми, покажемо повідомлення про помилку
  if (error && (!movies.length || !halls.length || !selectedMovie)) {
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
              onClick={() => {
                // Запобігаємо подвійній навігації
                if (isNavigatingRef.current) {
                  console.log('Navigation already in progress, ignoring back click');
                  return;
                }
                
                console.log('Navigating back to admin dashboard from error state');
                isNavigatingRef.current = true;
                navigate('/admin?tab=showtimes');
              }}
            >
              <FiArrowLeft />
            </motion.button>
            <h1>Error Loading Showtime</h1>
          </motion.div>
          
          <motion.div 
            className="admin-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="error-message" style={{ 
              color: '#d32f2f', 
              backgroundColor: '#fdecea', 
              padding: '20px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #f5c6cb',
              fontSize: '16px',
              textAlign: 'center'
            }}>
              <h3>Failed to load showtime data</h3>
              <p>{error}</p>
              <motion.button
                className="submit-button"
                style={{ marginTop: '20px' }}
                onClick={handleRetry}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </div>
          </motion.div>
        </div>
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