import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUpload, FiFilm, FiClock, FiStar, FiUser, FiInfo, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './AdminMovie.css';

const API_URL = 'http://localhost:5252';

function AdminMovie() {
  const navigate = useNavigate();

  // Перевірка прав доступу
  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('token');
    
    console.log('Auth check - Role:', userRole, 'Auth status:', isAuthenticated, 'Token exists:', !!token);
    
    if (!isAuthenticated || !token || userRole !== 'admin') {
      console.log('Authentication failed, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    ageRating: '',
    durationInMinutes: '',
    director: '',
    language: 'English',
    poster: null,
    posterPreview: null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  // Доступні вікові рейтинги
  const ageRatings = ['0', '6', '10', '12', '16','18'];

  // Доступні жанри
  const availableGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 
    'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => {
      const currentGenres = prev.genre ? prev.genre.split(',').map(g => g.trim()) : [];
    
      let newGenres;
      if (currentGenres.includes(genre)) {
        newGenres = currentGenres.filter(g => g !== genre);
      } else {
        newGenres = [...currentGenres, genre];
      }
      
      return {
        ...prev,
        genre: newGenres.join(', ')
      };
    });
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Перевірка на допустимі типи файлів
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only .jpg, .jpeg and .png formats are allowed');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        poster: file,
        posterPreview: URL.createObjectURL(file)
      }));
    }
  };

  // Оновлена версія handleSubmit згідно з контролером
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadProgress('Preparing data...');
    setIsLoading(true);

    try {
      // Перевірка авторизації
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization required to add a movie');
      }

      // Базова перевірка даних
      if (!formData.title || !formData.genre || !formData.durationInMinutes || !formData.poster) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        setUploadProgress('');
        return;
      }

      setUploadProgress('Preparing file for upload...');
      
      // Створення FormData для відправки файлу
      const movieData = new FormData();
      
      // Додавання всіх полів згідно з MovieDto
      movieData.append('title', formData.title);
      movieData.append('genre', formData.genre);
      movieData.append('description', formData.description);
      movieData.append('ageRating', formData.ageRating);
      movieData.append('durationInMinutes', formData.durationInMinutes);
      movieData.append('director', formData.director);
      movieData.append('language', formData.language);
      
      // Додаємо тимчасовий шлях для поля Image
      const tempImagePath = `/images/movies/temp_${Date.now()}.jpg`;
      movieData.append('image', tempImagePath);
      
      // Додавання постера як imageFile згідно з контролером
      if (formData.poster) {
        movieData.append('imageFile', formData.poster);
      }
      
      // Виведемо всі поля для дебагу
      console.log('FormData fields:');
      for (let [key, value] of movieData.entries()) {
        console.log(`${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
      }
      
      setUploadProgress('Sending data to server...');
      
      // ВАЖЛИВО: Правильний формат Bearer-токена для .NET
      let authToken = token;
      if (!token.startsWith('Bearer ')) {
        authToken = `Bearer ${token}`;
      }
      
      console.log('API endpoint:', `${API_URL}/api/movies`);
      console.log('Using authorization token format:', authToken.substring(0, 15) + '...');
      
      const response = await fetch(`${API_URL}/api/movies`, {
        method: 'POST',
        headers: {
          'Authorization': authToken
          // НЕ встановлюємо 'Content-Type' для FormData з файлами
        },
        body: movieData
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          
          // Обробка помилок валідації
          if (errorData.errors) {
            const validationErrors = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('\n');
            errorMessage = `Validation errors:\n${validationErrors}`;
          } else {
            errorMessage = errorData.error || errorData.title || errorData.message || errorMessage;
          }
          
          // Для помилки 401 (Unauthorized)
          if (response.status === 401) {
            console.log('Authorization error detected');
            errorMessage = 'You do not have permission to add movies. Please login as an admin user.';
          }
        } catch (e) {
          try {
            const textError = await response.text();
            console.error('Error response text:', textError);
            if (textError) errorMessage = textError;
          } catch (textError) {
            console.error('Failed to get error text:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Успішне додавання фільму
      const result = await response.json();
      console.log('Movie added successfully:', result);
      
      setSuccess('Movie added successfully!');
      setIsLoading(false);
      setUploadProgress('');
      
      // Очищення форми
      setFormData({
        title: '',
        genre: '',
        description: '',
        ageRating: '',
        durationInMinutes: '',
        director: '',
        language: 'English',
        poster: null,
        posterPreview: null
      });
      
      // Перенаправлення на сторінку адміністратора
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      console.error('Error adding movie:', error);
      setError(error.message || 'Error adding movie. Please try again later.');
      setIsLoading(false);
      setUploadProgress('');
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };
  
  // Перевіряємо, чи вибраний жанр
  const isGenreSelected = (genre) => {
    if (!formData.genre) return false;
    const genres = formData.genre.split(',').map(g => g.trim());
    return genres.includes(genre);
  };

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
          <h1>Add New Movie</h1>
        </motion.div>

        <motion.form 
          className="admin-content"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="form-row">
            <div className="form-group">
              <label>
                <FiFilm className="input-icon" />
                Movie Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="admin-input"
              />
            </div>

            <div className="form-group">
              <label>
                <FiClock className="input-icon" />
                Duration (minutes)
              </label>
              <input
                type="number"
                name="durationInMinutes"
                min="1"
                value={formData.durationInMinutes}
                onChange={handleInputChange}
                required
                className="admin-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FiUser className="input-icon" />
                Director
              </label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleInputChange}
                required
                className="admin-input"
              />
            </div>

            <div className="form-group">
              <label>
                <FiInfo className="input-icon" />
                Age Rating
              </label>
              <select
                name="ageRating"
                value={formData.ageRating}
                onChange={handleInputChange}
                required
                className="admin-input"
              >
                <option value="">Select age rating</option>
                {ageRatings.map(rating => (
                  <option key={rating} value={rating}>{rating}+</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>
              <FiMessageSquare className="input-icon" />
              Language
            </label>
            <input
              type="text"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              required
              className="admin-input"
            />
          </div>

          <div className="form-group">
            <label>Movie Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="admin-textarea"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Genres</label>
            <div className="genres-container">
              {availableGenres.map(genre => (
                <motion.button
                  key={genre}
                  type="button"
                  className={`genre-tag ${isGenreSelected(genre) ? 'active' : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {genre}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <FiUpload className="input-icon" />
              Movie Poster (only .jpg, .jpeg or .png)
            </label>
            <div className="poster-upload-container">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePosterChange}
                required
                className="poster-input"
                id="poster-input"
              />
              <label htmlFor="poster-input" className="poster-upload-label">
                {formData.posterPreview ? (
                  <img 
                    src={formData.posterPreview} 
                    alt="Movie poster preview" 
                    className="poster-preview"
                  />
                ) : (
                  <div className="poster-placeholder">
                    <FiUpload />
                    <span>Upload poster</span>
                  </div>
                )}
              </label>
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
          
          {uploadProgress && isLoading && (
            <div className="progress-message" style={{ 
              color: '#1976d2', 
              backgroundColor: '#e3f2fd', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #bee5eb',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div className="spinner" style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid #1976d2',
                borderTopColor: 'transparent',
                marginRight: '10px',
                animation: 'spin 1s linear infinite'
              }}></div>
              {uploadProgress}
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

export default AdminMovie; 