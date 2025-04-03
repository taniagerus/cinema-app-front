import React, { useState, useEffect } from 'react';
import './Home.css';
import { motion } from 'framer-motion';
import { FiSearch, FiBell, FiChevronRight, FiUser, FiPlus, FiClock, FiCalendar, FiFilter } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = 'http://localhost:5252';

function Home() {
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('userRole') === 'admin');
  
  // Відстежуємо зміни стану автентифікації
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
      setIsAdmin(localStorage.getItem('userRole') === 'admin');
    };
    
    // Перевіряємо при монтуванні компонента
    checkAuth();
    
    // Додаємо слухач для storage events
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [location.pathname]);
  
  // Завантажуємо сеанси, коли змінюється дата або часовий діапазон
  useEffect(() => {
    if (selectedDate || selectedTimeRange) {
      fetchShowtimes();
    }
  }, [selectedDate, selectedTimeRange]);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching movies from API...');
      
      const response = await fetch(`${API_URL}/api/movies`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch movies: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} movies from API`);
      setMovies(data);
      
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(`Failed to load movies: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchShowtimes = async () => {
    try {
      setIsLoadingShowtimes(true);
      console.log('Fetching showtimes with filters...');
      
      // Базовий URL для запиту сеансів
      let url = `${API_URL}/api/showtimes`;
      
      // Якщо є фільтри, додаємо параметри запиту
      const queryParams = [];
      
      if (selectedDate) {
        // Форматуємо дату у формат API: YYYY-MM-DD
        queryParams.push(`date=${selectedDate}`);
      }
      
      if (selectedTimeRange) {
        const [startTime, endTime] = selectedTimeRange.split('-');
        if (startTime) queryParams.push(`startTimeFrom=${startTime}:00`);
        if (endTime) queryParams.push(`startTimeTo=${endTime}:00`);
      }
      
      // Додаємо параметри запиту до URL
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }
      
      console.log('Fetching showtimes from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch showtimes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Loaded ${data.length} showtimes from API:`, data);
      
      // Перевіряємо, чи отримана відповідь є масивом, якщо ні - використовуємо пустий масив
      const validData = Array.isArray(data) ? data : [];
      setShowtimes(validData);
      
      if (validData.length === 0) {
        console.log('No showtimes found for the selected filters');
      }
      
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      setError(`Failed to load showtimes: ${error.message}`);
      setShowtimes([]); // Скидаємо сеанси у разі помилки
    } finally {
      setIsLoadingShowtimes(false);
    }
  };
  
  // Функція для форматування відображення часу
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  };

  // Функція для отримання часових діапазонів
  const getTimeRanges = () => [
    { label: 'All Day', value: '' },
    { label: 'Morning (06:00-12:00)', value: '06:00-12:00' },
    { label: 'Afternoon (12:00-18:00)', value: '12:00-18:00' },
    { label: 'Evening (18:00-23:59)', value: '18:00-23:59' }
  ];

  // Categories for filtering
  const categories = ['Now Showing', 'Coming Soon', 'Popular', 'Top Rated'];
  
  // Get unique genres from movies
  const allGenres = [...new Set(movies.flatMap(movie => 
    movie.genre ? movie.genre.split(',').map(g => g.trim()) : []
  ))];

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  const resetFilters = () => {
    setSelectedDate('');
    setSelectedTimeRange('');
    setShowFilters(false);
  };

  const handleUserIconClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLoginClick = () => {
    navigate('/login');
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setShowUserMenu(false);
    setHoveredMovie(null);
    setSelectedGenres([]);
    setActiveCategory('Popular');
    setIsAuthenticated(false);
    setIsAdmin(false);
    navigate('/', { replace: true });
  };

  const handleBookNowClick = (movie, showtime = null) => {
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!isAuthenticated || !token) {
      // Save current booking state
      localStorage.setItem('bookingState', JSON.stringify({
        movie,
        showtime,
        returnUrl: '/booking'
      }));
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    // Navigate to booking with movie and optional showtime
    if (showtime) {
      navigate('/booking', { state: { movie, showtime } });
    } else {
      navigate('/booking', { state: { movie } });
    }
  };

  const handleViewDetailsClick = (movie) => {
    navigate('/details', { state: { movie } });
  };

  const handleAddShowtime = () => {
    navigate('/admin/showtime');
  };

  const handleAddMovie = () => {
    navigate('/admin/movie');
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Якщо є відфільтровані сеанси, отримуємо список фільмів для цих сеансів
  const getFilteredMoviesByShowtimes = () => {
    if (!showtimes.length) return [];
    
    // Створюємо карту фільмів для швидкого пошуку
    const moviesMap = movies.reduce((acc, movie) => {
      acc[movie.id] = movie;
      return acc;
    }, {});
    
    // Отримуємо унікальні фільми з сеансів
    const uniqueMovies = [...new Set(showtimes.map(showtime => showtime.movieId))]
      .map(movieId => moviesMap[movieId])
      .filter(Boolean); // Фільтруємо undefined значення
      
    return uniqueMovies;
  };

  // Додаємо функцію форматування дати
  const formatShowtimeDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Додаємо функцію форматування часу
  const formatShowtimeTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Остаточний список фільмів для відображення
  const filteredMovies = (() => {
    // Якщо є сеанси та фільтри за датою/часом, використовуємо фільтрацію за сеансами
    if ((selectedDate || selectedTimeRange) && showtimes.length > 0) {
      const filteredByShowtimes = getFilteredMoviesByShowtimes();
      
      // Далі фільтруємо за пошуковим запитом та жанрами
      return filteredByShowtimes.filter(movie => {
        if (!movie) return false;
        
        // Фільтр за пошуковим запитом
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          if (!(movie.title.toLowerCase().includes(searchLower) ||
              (movie.genre && movie.genre.toLowerCase().includes(searchLower)) ||
              (movie.description && movie.description.toLowerCase().includes(searchLower)))) {
            return false;
          }
        }

        // Фільтр за жанрами
        if (selectedGenres.length > 0) {
          const movieGenres = movie.genre ? movie.genre.split(',').map(g => g.trim()) : [];
          if (!selectedGenres.some(genre => movieGenres.includes(genre))) {
            return false;
          }
        }

        return true;
      });
    } else {
      // Якщо немає фільтрів за датою/часом, використовуємо звичайну фільтрацію
      return movies.filter(movie => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            movie.title.toLowerCase().includes(searchLower) ||
            (movie.genre && movie.genre.toLowerCase().includes(searchLower)) ||
            (movie.description && movie.description.toLowerCase().includes(searchLower))
          );
        }

        if (selectedGenres.length > 0) {
          const movieGenres = movie.genre ? movie.genre.split(',').map(g => g.trim()) : [];
          return selectedGenres.some(genre => movieGenres.includes(genre));
        }

        return true;
      });
    }
  })();

  return (
    <div className="cinema-dashboard">
      {/* Top Navigation Bar */}
      <motion.nav 
        className="top-nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="nav-left">
          <h1 className="logo">CINEMATIX</h1>
          <div className="nav-links">
            {['Home', 'Movies', 'Cinemas', 'Deals'].map((link) => (
              <motion.a
                key={link}
                href="#"
                className="nav-link"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </div>
        
        <div className="nav-right">
          <motion.div 
            className="search-container"
            whileFocus={{ scale: 1.05 }}
          >
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук фільмів..." 
              className="search-input"
            />
            <FiSearch className="search-icon" />
          </motion.div>
          
          <motion.button 
            className="filter-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleFilters}
          >
            <FiFilter />
          </motion.button>
          
          <motion.button 
            className="notification-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiBell />
          </motion.button>
          
          <motion.div 
            className="user-menu-container"
            style={{ position: 'relative' }}
          >
            <motion.div 
              className="user-avatar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUserIconClick}
            >
              <FiUser />
            </motion.div>
            
            {showUserMenu && (
              <motion.div 
                className="user-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {!isAuthenticated ? (
                  <div className="dropdown-item" onClick={handleLoginClick}>
                    Login
                  </div>
                ) : (
                  <>
                    <div className="dropdown-item user-role">
                      {isAdmin ? 'Administrator' : 'User'}
                    </div>
                    <div className="dropdown-item" onClick={handleLogoutClick}>
                      Logout
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.nav>

      {/* Фільтри за датою та часом */}
      {showFilters && (
        <motion.div 
          className="date-time-filters"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="filter-header">
            <h3>Filter Showtimes</h3>
            <button 
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
          
          <div className="filters-container">
            <div className="filter-group">
              <label>
                <FiCalendar className="filter-icon" />
                Date
              </label>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="date-input"
              />
            </div>
            
            <div className="filter-group">
              <label>
                <FiClock className="filter-icon" />
                Time Range
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="time-select"
              >
                {getTimeRanges().map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoadingShowtimes && (
            <div className="filter-loading">Fetching showtimes...</div>
          )}
          
          {selectedDate || selectedTimeRange ? (
            <div className="active-filters">
              <p>
                {selectedDate && `Date: ${new Date(selectedDate).toLocaleDateString()}`}
                {selectedDate && selectedTimeRange && ' | '}
                {selectedTimeRange && `Time: ${selectedTimeRange}`}
              </p>
              <p className="found-results">
                Found {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
              </p>
            </div>
          ) : null}
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div 
        className="main-content no-hero"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Category Tabs */}
        <div className="category-container">
          <div className="category-tabs">
            {categories.map(category => (
              <motion.button
                key={category}
                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
          
          {isAdmin && (
            <div className="admin-buttons">
              <motion.button 
                className="add-showtime-btn"
                onClick={handleAddShowtime}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="icon" />
                Add Showtime
              </motion.button>
              
              <motion.button 
                className="add-movie-btn"
                onClick={handleAddMovie}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiPlus className="icon" />
                Add Movie
              </motion.button>
            </div>
          )}
        </div>
        
        {/* Genre Filters */}
        <div className="genre-filters">
          {allGenres.map(genre => (
            <motion.button
              key={genre}
              className={`genre-btn ${selectedGenres.includes(genre) ? 'active' : ''}`}
              onClick={() => toggleGenre(genre)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {genre}
            </motion.button>
          ))}
        </div>
        
        {/* Movie Grid */}
        {isLoading ? (
          <div className="loading-message">Loading movies...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredMovies.length === 0 ? (
          <div className="no-movies-message">
            <h3>No movies found</h3>
            <p>Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="movie-grid">
            {filteredMovies.map((movie, index) => (
              <motion.div 
                key={movie.id} 
                className="movie-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredMovie(movie.id)}
                onMouseLeave={() => setHoveredMovie(null)}
              >
                <div className="movie-poster-container">
                  <img
                    src={`${API_URL}${movie.image}`}
                    alt={movie.title}
                    className="movie-poster"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-movie.jpg';
                    }}
                  />
                  <div className="movie-rating">
                    {movie.ageRating}+
                  </div>
                  
                  {hoveredMovie === movie.id && (
                    <motion.div 
                      className="movie-actions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Відображаємо доступні сеанси, якщо є фільтри за датою/часом */}
                      {(selectedDate || selectedTimeRange) && showtimes.length > 0 && (
                        <div className="available-showtimes">
                          <h4>Доступні сеанси:</h4>
                          <div className="showtime-list">
                            {showtimes
                              .filter(showtime => showtime.movieId === movie.id)
                              .slice(0, 3)
                              .map(showtime => (
                                <div 
                                  key={showtime.id} 
                                  className="showtime-item"
                                  onClick={() => handleBookNowClick(movie, showtime)}
                                >
                                  <span className="showtime-date">
                                    {formatShowtimeDate(showtime.startTime)}
                                  </span>
                                  <span className="showtime-time">
                                    {formatShowtimeTime(showtime.startTime)}
                                  </span>
                                  <span className="showtime-price">
                                    ${showtime.price.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            {showtimes.filter(showtime => showtime.movieId === movie.id).length > 3 && (
                              <div className="more-showtimes">
                                + ще {showtimes.filter(showtime => showtime.movieId === movie.id).length - 3} сеансів
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <motion.button 
                        className="movie-book-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBookNowClick(movie)}
                      >
                        Book Now
                      </motion.button>
                      <motion.button 
                        className="movie-details-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetailsClick(movie)}
                      >
                        Details
                      </motion.button>
                    </motion.div>
                  )}
                </div>
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                  <div className="movie-meta-info">
                    <span className="movie-duration">
                      <FiClock className="icon" />
                      {movie.durationInMinutes} min
                    </span>
                    <span className="movie-language">{movie.language}</span>
                  </div>
                  <div className="movie-genres-list">
                    {movie.genre && movie.genre.split(',').map((genre, idx) => (
                      <span key={idx} className="movie-genre-tag">
                        {genre.trim()}{idx < movie.genre.split(',').length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Home;