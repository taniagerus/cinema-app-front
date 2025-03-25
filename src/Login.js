import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = 'http://localhost:5252';

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
      console.log('Attempting login with data:', { username: formData.username });

      // Виконання запиту на сервер для авторизації
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

      // Отримання даних користувача і токена
      const userData = await response.json();
      console.log('Login successful, received data:', JSON.stringify(userData, null, 2));

      // Перевірка наявності токена і встановлення у правильному форматі
      if (!userData.token) {
        throw new Error('Authorization token was not received');
      }

      // Зберігаємо токен без префіксу "Bearer " - ми додамо його при виконанні запитів
      // Це важливо для роботи з ASP.NET Core, який очікує формат "Bearer {token}"
      // Якщо токен вже містить "Bearer ", видаляємо цей префікс
      let cleanToken = userData.token;
      if (cleanToken.startsWith('Bearer ')) {
        cleanToken = cleanToken.substring(7);
      }
      console.log('Token saved (first 15 chars):', cleanToken.substring(0, 15) + '...');

      // Перетворюємо роль на нижній регістр для консистентності в клієнтській перевірці,
      // але зберігаємо оригінальний регістр для відправки на сервер
      const userRole = userData.role ? userData.role.toLowerCase() : 'user';
      const originalRole = userData.role || 'user';
      console.log('User role (original):', originalRole);
      console.log('User role (converted to lowercase for client checks):', userRole);

      // Зберігаємо дані користувача в localStorage
      localStorage.setItem('token', cleanToken); // Токен без "Bearer " префіксу
      localStorage.setItem('originalRole', originalRole); // Оригінальний регістр ролі
      localStorage.setItem('userName', userData.userName || formData.username);
      localStorage.setItem('userRole', userRole); // Роль в нижньому регістрі для клієнтських перевірок
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('User data saved to localStorage, redirecting based on role');

      // Навігація на основі ролі користувача
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

      // Перезавантаження сторінки для оновлення всіх станів
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