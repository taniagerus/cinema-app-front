import React, { useState } from 'react';
import './Home.css';
import { motion } from 'framer-motion';
import { FiSearch, FiBell, FiChevronRight, FiUser, FiPlus } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  const isAdmin = localStorage.getItem('userRole') === 'admin';
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // Sample movie data
  const movies = [
    {
      id: 1,
      title: 'Dune: Part Two',
      year: 2024,
      rating: 8.7,
      duration: '166 min',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'
    },
    {
      id: 2,
      title: 'Godzilla x Kong',
      year: 2024,
      rating: 7.8,
      duration: '115 min',
      genres: ['Action', 'Sci-Fi', 'Thriller'],
      poster: 'https://image.tmdb.org/t/p/w500/tVxZMMhTCdQzrR1HGRuHR0qyZnk.jpg'
    },
    {
      id: 3,
      title: 'The Fall Guy',
      year: 2024,
      rating: 7.9,
      duration: '126 min',
      genres: ['Action', 'Comedy'],
      poster: 'https://image.tmdb.org/t/p/w500/xCpZxQKMjlCzHEEaeLLHgGT4Iye.jpg'
    },
    {
      id: 4,
      title: 'Kung Fu Panda 4',
      year: 2024,
      rating: 6.9,
      duration: '94 min',
      genres: ['Animation', 'Action', 'Comedy'],
      poster: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqld.jpg'
    },
    {
      id: 5,
      title: 'Civil War',
      year: 2024,
      rating: 6.8,
      duration: '109 min',
      genres: ['Action', 'Drama', 'Thriller'],
      poster: 'https://image.tmdb.org/t/p/w500/5D3GkPmwg6JTKRJy1HkJ5nXdECJ.jpg'
    },
    {
      id: 6,
      title: 'Kingdom of the Planet of the Apes',
      year: 2024,
      rating: 7.2,
      duration: '145 min',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      poster: 'https://image.tmdb.org/t/p/w500/8tJHOAUUxPPvKz6uKGvUqDpZ5YH.jpg'
    },
  ];

  // Categories for filtering
  const categories = ['Now Showing', 'Coming Soon', 'Popular', 'Top Rated'];
  
  // Genres for filtering
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Animation', 'Thriller'];

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleUserIconClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLoginClick = () => {
    navigate('/login');
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    // Clear all authentication data
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    
    // Close the user menu
    setShowUserMenu(false);
    
    // Reset any user-specific state
    setHoveredMovie(null);
    setSelectedGenres([]);
    setActiveCategory('Popular');
    
    // Redirect to home page
    navigate('/', { replace: true });
    
    // Optional: Reload the page to reset all states
    window.location.reload();
  };

  const handleBookNowClick = (movie) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/booking', { state: { movie } });
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
              placeholder="Пошук фільмів..." 
              className="search-input"
            />
            <FiSearch className="search-icon" />
          </motion.div>
          
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
          {genres.map(genre => (
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
        <div className="movie-grid">
          {movies.map((movie, index) => (
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
                  src={movie.poster}
                  alt={movie.title}
                  className="movie-poster"
                />
                <div className="movie-rating">
                  <FaStar className="star-icon" /> {movie.rating}
                </div>
                
                {hoveredMovie === movie.id && (
                  <motion.div 
                    className="movie-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
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
                <div className="movie-meta-info">
                  <span>{movie.year}</span>
                  <span>{movie.duration}</span>
                </div>
                <div className="movie-genres-list">
                  {movie.genres.map((genre, idx) => (
                    <span key={idx} className="movie-genre-tag">
                      {genre}{idx < Math.min(movie.genres.length - 1, 1) ? ' • ' : ''}
                    </span>
                  )).slice(0, 2)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Home;