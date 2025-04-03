import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiFilm, FiClock, FiInfo, FiUser } from 'react-icons/fi';
import './AdminMovie.css';

const API_URL = 'http://localhost:5252';

function EditMovie() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Додаємо ref для відстеження стану навігації та монтування компонента
  const isNavigatingRef = useRef(false);
  const isMounted = useRef(true);
  
  // Додаємо функцію для безпечної навігації у вигляді useCallback
  const safeNavigate = useCallback((path) => {
    // Запобігаємо подвійній навігації
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring navigation request');
      return;
    }
    
    console.log(`Safely navigating to: ${path}`);
    isNavigatingRef.current = true;
    navigate(path);
  }, [navigate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationInMinutes, setDurationInMinutes] = useState('');
  const [ageRating, setAgeRating] = useState('');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [director, setDirector] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Встановлюємо, що компонент змонтований
    isMounted.current = true;
    
    const fetchMovie = async () => {
      try {
        console.log(`Fetching movie data for ID: ${id}`);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authorization required');
        }

        let authToken = token.trim();
        if (!authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}/api/movies/${id}`, {
          headers: {
            'Authorization': authToken
          }
        });

        // Перевіряємо чи компонент все ще активний після очікування відповіді
        if (!isMounted.current) {
          console.log('Component unmounted during fetch, aborting data update');
          return;
        }

        if (!response.ok) {
          // Отримуємо текст помилки для аналізу
          const errorText = await response.text();
          console.error('Server response error:', errorText);
          throw new Error(`Failed to fetch movie: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Movie data received:', data);
        
        // Перевіряємо чи компонент все ще активний перед оновленням стану
        if (!isMounted.current) {
          console.log('Component unmounted after data received, aborting state update');
          return;
        }
        
        setTitle(data.title);
        setDescription(data.description);
        setDurationInMinutes(data.durationInMinutes.toString());
        setCurrentImage(data.image);
        setAgeRating(data.ageRating?.toString() || '');
        setLanguage(data.language || '');
        setGenre(data.genre || '');
        setDirector(data.director || '');
        console.log('Movie data loaded successfully');

      } catch (error) {
        console.error('Error fetching movie:', error);
        if (isMounted.current) {
          setError('Failed to load movie data: ' + error.message);
          // Використовуємо safeNavigate замість navigate
          safeNavigate('/admin');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchMovie();
  }, [id, safeNavigate]);

  useEffect(() => {
    // Скидаємо стан при розмонтуванні
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Запобігаємо подвійному відправленню форми
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring submit');
      return;
    }
    
    console.log('Submitting movie edit form...');
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Валідація даних
    if (title.trim().length < 2 || title.trim().length > 100) {
      setError('Назва фільму повинна бути від 2 до 100 символів');
      setIsLoading(false);
      return;
    }

    if (description.trim().length < 10 || description.trim().length > 1000) {
      setError('Опис фільму повинен бути від 10 до 1000 символів');
      setIsLoading(false);
      return;
    }

    const duration = parseInt(durationInMinutes);
    if (isNaN(duration) || duration < 1 || duration > 1000) {
      setError('Тривалість фільму повинна бути від 1 до 1000 хвилин');
      setIsLoading(false);
      return;
    }
    
    const rating = parseInt(ageRating);
    if (isNaN(rating) || rating < 0 || rating > 18) {
      setError('Вікове обмеження має бути числом від 0 до 18');
      setIsLoading(false);
      return;
    }

    if (director.trim().length < 2 || director.trim().length > 100) {
      setError('Ім\'я режисера повинно бути від 2 до 100 символів');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Sending movie update request...');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization required');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const formData = new FormData();
      formData.append('Title', title.trim());
      formData.append('Description', description.trim());
      formData.append('DurationInMinutes', duration.toString());
      formData.append('AgeRating', rating.toString());
      formData.append('Language', language.trim());
      formData.append('Genre', genre.trim());
      formData.append('Director', director.trim());
      
      if (imageFile) {
        formData.append('ImageFile', imageFile);
      } else {
        // Якщо новий файл не завантажений, передаємо поточний шлях до зображення
        formData.append('Image', currentImage || '');
      }

      console.log('Sending request to update movie:', formData);
      const response = await fetch(`${API_URL}/api/movies/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': authToken
        },
        body: formData
      });

      // Перевіряємо чи компонент все ще активний
      if (!isMounted.current) {
        console.log('Component unmounted during update, aborting completion');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            throw new Error(errorData.error);
          } else if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
              .join('\n');
            throw new Error(`Помилки валідації:\n${errorMessages}`);
          } else {
            throw new Error(errorData.title || errorData.message || 'Помилка оновлення фільму');
          }
        } catch (jsonError) {
          if (jsonError.message.startsWith('Помилки валідації')) {
            throw jsonError;
          }
          throw new Error(`Помилка сервера: ${response.status} - ${errorText || 'Помилка оновлення фільму'}`);
        }
      }

      console.log('Movie updated successfully');
      
      if (!isMounted.current) return;
      
      setSuccess('Movie updated successfully!');
      setIsLoading(false);
      
      // Використовуємо setTimeout з safeNavigate
      setTimeout(() => {
        if (isMounted.current) {
          console.log('Navigating to admin dashboard after saving movie');
          safeNavigate('/admin');
        }
      }, 2000);
    } catch (error) {
      console.error('Error updating movie:', error);
      if (isMounted.current) {
        setError(error.message || 'Error updating movie');
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    safeNavigate('/admin');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
      } else {
        setError('Please select an image file');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="admin-page">
        <div className="loading-message">Loading movie data...</div>
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
            onClick={() => safeNavigate('/admin')}
          >
            <FiArrowLeft />
          </motion.button>
          <h1>Edit Movie</h1>
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
              <FiFilm className="input-icon" />
              Movie Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter movie title"
            />
          </div>

          <div className="form-group">
            <label>
              <FiUser className="input-icon" />
              Director
            </label>
            <input
              type="text"
              value={director}
              onChange={(e) => setDirector(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter movie director"
            />
          </div>

          <div className="form-group">
            <label>
              <FiInfo className="input-icon" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter movie description"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>
              <FiClock className="input-icon" />
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationInMinutes}
              onChange={(e) => setDurationInMinutes(e.target.value)}
              required
              min="1"
              className="admin-input"
              placeholder="Enter duration in minutes"
            />
          </div>
          
          <div className="form-group">
            <label>
              Age Rating
            </label>
            <input
              type="number"
              value={ageRating}
              onChange={(e) => setAgeRating(e.target.value)}
              required
              min="0"
              max="18"
              className="admin-input"
              placeholder="Enter age rating (0-18)"
            />
          </div>
          
          <div className="form-group">
            <label>
              Language
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter movie language"
            />
          </div>
          
          <div className="form-group">
            <label>
              Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter movie genres (comma separated)"
            />
          </div>

          <div className="form-group">
            <label>
              Current Image
            </label>
            {currentImage && (
              <img 
                src={`${API_URL}${currentImage}`} 
                alt="Current movie poster" 
                style={{ 
                  maxWidth: '200px', 
                  marginBottom: '10px',
                  borderRadius: '4px'
                }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-movie.jpg';
                }}
              />
            )}
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="admin-input"
            />
            <small style={{ color: '#666' }}>
              Leave empty to keep current image
            </small>
          </div>

          {error && (
            <div className="error-message" style={{ 
              color: '#d32f2f', 
              backgroundColor: '#fdecea', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              border: '1px solid #f5c6cb',
              whiteSpace: 'pre-line'
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
              disabled={isLoading || isNavigatingRef.current}
            >
              {isLoading ? 'SAVING...' : isNavigatingRef.current ? 'REDIRECTING...' : 'SAVE'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default EditMovie; 