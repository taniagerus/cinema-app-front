import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:5252';

// Функція для розбору JWT токена
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with data:', { email: formData.email });

      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error:', errorData);
        throw new Error(errorData.message || 'Помилка авторизації');
      }

      const userData = await response.json();
      console.log('Login successful, received data:', JSON.stringify(userData, null, 2));

      if (!userData.token) {
        throw new Error('Authorization token was not received');
      }

      let cleanToken = userData.token;
      if (cleanToken.startsWith('Bearer ')) {
        cleanToken = cleanToken.substring(7);
      }

      // Розбираємо JWT токен для отримання правильного userId
      const decodedToken = parseJwt(cleanToken);
      console.log('Decoded token:', decodedToken);

      // Отримуємо правильний userId з поля nameidentifier
      const userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      console.log('Using userId from token:', userId);

      const userRole = userData.role ? userData.role.toLowerCase() : 'user';
      const originalRole = userData.role || 'user';

      // Зберігаємо дані користувача в localStorage
      localStorage.setItem('token', cleanToken);
      localStorage.setItem('originalRole', originalRole);
      localStorage.setItem('userName', userData.userName || formData.email);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', userId); // Зберігаємо правильний userId
      
      console.log('User data saved to localStorage, redirecting based on role');

      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

      window.location.reload();
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Помилка авторизації. Спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <motion.button 
              className="back-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
            >
              <FiArrowLeft />
            </motion.button>
            <h1 className="auth-title">Login</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>
            
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <motion.button 
              type="submit" 
              className="auth-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </motion.button>
          </form>
          
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register" className="auth-link">Register</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;