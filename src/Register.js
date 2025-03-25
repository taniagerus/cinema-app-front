import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiCalendar, FiArrowLeft, FiKey } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

const API_URL = 'http://localhost:5252';
const ADMIN_SECRET_CODE = 'ADMIN123'; // В реальному проекті це має бути в захищеному місці

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    birthday: '',
    adminCode: '',
    role: 'User'
  });
  const [showAdminField, setShowAdminField] = useState(false);
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

    // Валідація даних
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Перевірка коду адміністратора
    if (showAdminField) {
      if (formData.adminCode !== ADMIN_SECRET_CODE) {
        setError('Invalid administrator code');
        return;
      }
      formData.role = 'Admin';
    }

    setIsLoading(true);

    try {
      // Форматуємо дату в ISO 8601
      const formattedBirthday = new Date(formData.birthday).toISOString();

      const registrationData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthday: formattedBirthday,
        role: formData.role
      };

      // Реєстрація користувача
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration error');
      }

      // Автоматичний вхід після реєстрації
      const loginResponse = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const loginResponseData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(loginResponseData.message || loginResponseData.error || 'Automatic login error');
      }

      // Зберігаємо токен та дані користувача
      localStorage.setItem('token', loginResponseData.token);
      localStorage.setItem('userEmail', loginResponseData.email);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', formData.role.toLowerCase());
      
      // Перенаправлення в залежності від ролі
      if (formData.role.toLowerCase() === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
      // Перезавантаження сторінки для оновлення всіх станів
      window.location.reload();
    } catch (error) {
      setError(error.message || 'Registration error. Please try again later.');
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
            <h1 className="auth-title">Register</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>

            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>
            
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
              <FiCalendar className="input-icon" />
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
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
            
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="auth-input"
              />
            </div>
            
            <div className="admin-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showAdminField}
                  onChange={() => setShowAdminField(!showAdminField)}
                />
                Register as administrator
              </label>
            </div>

            {showAdminField && (
              <motion.div 
                className="input-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <FiKey className="input-icon" />
                <input
                  type="password"
                  name="adminCode"
                  placeholder="Administrator Code"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  required={showAdminField}
                  className="auth-input"
                />
              </motion.div>
            )}

            {error && <div className="error-message">{error}</div>}
            
            <motion.button 
              type="submit" 
              className="auth-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Register'}
            </motion.button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;