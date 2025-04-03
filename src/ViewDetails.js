import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiClock, FiCalendar, FiUser, FiGlobe } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import './ViewDetails.css';

const API_URL = 'http://localhost:5252';

function ViewDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const movie = location.state?.movie;

  // Handle case when no movie data is passed
  if (!movie) {
    return (
      <div className="movie-details-container">
        <div className="details-error">
          <h2>Movie details not found</h2>
          <button onClick={() => navigate('/')} className="back-button">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-details-container">
      <motion.div 
        className="details-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button 
          className="back-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
        >
          <FiArrowLeft />
          <span>Back</span>
        </motion.button>
        <h1>Movie Details</h1>
      </motion.div>

      <div className="details-content">
        <motion.div 
          className="movie-poster-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img 
            src={`${API_URL}${movie.image}`} 
            alt={movie.title} 
            className="details-poster"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-movie.jpg';
            }}
          />
        </motion.div>

        <motion.div 
          className="movie-info-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="movie-title">{movie.title}</h2>
          
          <div className="movie-meta">
            <div className="meta-item">
              <FiUser className="meta-icon" />
              <span>{movie.ageRating}+</span>
            </div>
            <div className="meta-item">
              <FiClock className="meta-icon" />
              <span>{movie.durationInMinutes} min</span>
            </div>
            <div className="meta-item">
              <FiGlobe className="meta-icon" />
              <span>{movie.language}</span>
            </div>
          </div>

          <div className="movie-genres">
            {movie.genre && movie.genre.split(',').map((genre, index) => (
              <span key={index} className="genre-tag">{genre.trim()}</span>
            ))}
          </div>

          <div className="movie-description">
            <h3>Synopsis</h3>
            <p>{movie.description}</p>
          </div>

          <div className="movie-additional-info">
            <div className="info-row">
              <span className="info-label">Director:</span>
              <span className="info-value">{movie.director}</span>
            </div>
          </div>

          <motion.button 
            className="book-ticket-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/booking', { state: { movie } })}
          >
            Book Tickets
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default ViewDetails;
