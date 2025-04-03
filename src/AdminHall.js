import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiGrid, FiSave, FiX } from 'react-icons/fi';
import './AdminHall.css';

// Перевіряємо, чи є змінна API_URL в localStorage, якщо ні - використовуємо значення за замовчуванням
const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

function AdminHall() {
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const isNavigatingRef = useRef(false);
  
  const [name, setName] = useState('');
  const [rows, setRows] = useState('');
  const [seatsPerRow, setSeatsPerRow] = useState('');
  const [cinemaId, setCinemaId] = useState('');
  const [cinemas, setCinemas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [hallData, setHallData] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    let isComponentMounted = true;

    const checkAuthAndFetchData = async () => {
      try {
        console.log('Starting initialization...');
        setIsLoading(true);
        
        const userRole = localStorage.getItem('userRole')?.toLowerCase();
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const token = localStorage.getItem('token');

        console.log('Auth state:', { userRole, isAuthenticated, hasToken: !!token });

        if (!isAuthenticated || !token || userRole !== 'admin') {
          console.log('Authentication failed, redirecting to login');
          localStorage.clear();
          navigate('/login');
          return;
        }

        console.log('Authentication successful, fetching cinemas...');
        const cinemasData = await fetchCinemas();
        
        if (isComponentMounted) {
          console.log('Setting cinemas data:', cinemasData);
          setCinemas(cinemasData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (isComponentMounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    checkAuthAndFetchData();

    return () => {
      isComponentMounted = false;
      isMounted.current = false;
    };
  }, [navigate]);

  useEffect(() => {
    const fetchHallData = async () => {
      if (!selectedTime?.hallId) return;

      try {
        console.log('Fetching hall data for hallId:', selectedTime.hallId);
        
        const token = localStorage.getItem('token');
        let authToken = token?.trim();
        if (authToken && !authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        // Fetch hall data
        const hallResponse = await fetch(`${API_URL}/api/halls/${selectedTime.hallId}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!hallResponse.ok) {
          throw new Error('Failed to fetch hall data');
        }

        const hallData = await hallResponse.json();
        console.log('Received hall data:', hallData);
        
        if (!hallData.seats || hallData.seats.length === 0) {
          console.error('No seats data received from the server');
          throw new Error('No seats configuration available');
        }

        setHallData(hallData);

        // Organize seats into rows
        const organizedSeats = [];
        for (let row = 1; row <= hallData.rows; row++) {
          const rowSeats = hallData.seats
            .filter(seat => seat.rowNumber === row)
            .sort((a, b) => a.seatNumber - b.seatNumber);
          if (rowSeats.length === 0) {
            console.warn(`No seats found for row ${row}`);
          }
          organizedSeats.push(rowSeats);
        }
        console.log('Organized seats:', organizedSeats);
        setSeats(organizedSeats);

      } catch (error) {
        console.error('Error fetching hall data:', error);
        setError('Failed to load hall configuration');
      }
    };

    fetchHallData();
  }, [selectedTime]);

  const fetchCinemas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authorization token found');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      console.log('Making API request to:', `${API_URL}/api/cinemas`);
      
      const response = await fetch(`${API_URL}/api/cinemas`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch cinemas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received cinemas data:', data);

      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        throw new Error('Invalid data format received from server');
      }

      return data;
    } catch (error) {
      console.error('Error in fetchCinemas:', error);
      throw new Error(`Failed to load cinemas: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('Form submission already in progress');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      console.log('Starting hall creation...');
      
      // Validation
      if (!name.trim()) {
        throw new Error('Hall name is required');
      }

      const rowsNum = parseInt(rows);
      const seatsNum = parseInt(seatsPerRow);
      const selectedCinemaId = parseInt(cinemaId);

      if (!rowsNum || rowsNum < 1 || rowsNum > 20) {
        throw new Error('Number of rows must be between 1 and 20');
      }

      if (!seatsNum || seatsNum < 1 || seatsNum > 30) {
        throw new Error('Number of seats per row must be between 1 and 30');
      }

      if (!selectedCinemaId) {
        throw new Error('Please select a cinema');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authorization required');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const createHallData = {
        name: name.trim(),
        rows: rowsNum,
        seatsPerRow: seatsNum,
        cinemaId: selectedCinemaId
      };

      console.log('Sending hall data:', createHallData);
      console.log('API URL:', `${API_URL}/api/halls`);

      const response = await fetch(`${API_URL}/api/halls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify(createHallData)
      });

      console.log('Create hall response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.errors) {
            const errorMessages = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('\n');
            errorMessage = `Validation errors:\n${errorMessages}`;
          } else {
            errorMessage = errorData.message || errorData.title || JSON.stringify(errorData);
          }
        } catch (jsonError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log('Hall created successfully:', responseData);
      
      setSuccess('Hall created successfully!');
      
      // Негайне перенаправлення після успішного створення
      console.log('Navigating to admin dashboard with halls tab...');
      navigate('/admin?tab=halls', { replace: true });
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      if (isMounted.current) {
        setError(error.message || 'Failed to create hall');
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    navigate('/admin?tab=halls');
  };

  if (isLoading) {
    console.log('Rendering loading state...');
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
              onClick={() => navigate('/admin')}
            >
              <FiArrowLeft />
            </motion.button>
            <h1>Add New Hall</h1>
          </motion.div>

          <motion.div 
            className="loading-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="message-content">
              <span className="message-title">Loading cinemas...</span>
              <span className="message-subtitle">Please wait while we fetch the available cinemas</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && (!cinemas || cinemas.length === 0)) {
    console.log('Rendering error state:', error);
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
              onClick={() => navigate('/admin')}
            >
              <FiArrowLeft />
            </motion.button>
            <h1>Add New Hall</h1>
          </motion.div>

          <motion.div 
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="message-content">
              <span className="message-title">{error}</span>
              <span className="message-subtitle">
                {error.includes('No cinemas available') 
                  ? 'Please create a cinema first before adding a hall'
                  : 'Please try again later or contact the administrator'}
              </span>
            </div>
          </motion.div>

          <div className="admin-actions">
            <motion.button
              className="cancel-button"
              onClick={() => navigate('/admin')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX className="button-icon" />
              BACK TO DASHBOARD
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering main form with cinemas:', cinemas);

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
          <h1>Add New Hall</h1>
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
              <FiHome className="input-icon" />
              Hall Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="admin-input"
              placeholder="Enter hall name"
            />
          </div>

          <div className="form-group">
            <label>
              <FiGrid className="input-icon" />
              Number of Rows
            </label>
            <input
              type="number"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              required
              min="1"
              max="20"
              className="admin-input"
              placeholder="Enter number of rows (1-20)"
            />
          </div>

          <div className="form-group">
            <label>
              <FiGrid className="input-icon" />
              Seats Per Row
            </label>
            <input
              type="number"
              value={seatsPerRow}
              onChange={(e) => setSeatsPerRow(e.target.value)}
              required
              min="1"
              max="30"
              className="admin-input"
              placeholder="Enter seats per row (1-30)"
            />
          </div>

          <div className="form-group">
            <label>
              <FiHome className="input-icon" />
              Cinema
            </label>
            <select 
              value={cinemaId}
              onChange={(e) => setCinemaId(e.target.value)}
              required
              className="admin-select"
            >
              <option value="">Select a cinema</option>
              {cinemas.map(cinema => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-content">
                <span className="message-title">
                  {error}
                </span>
              </div>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              className="success-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-content">
                <span className="message-title">
                  {success}
                </span>
                <span className="message-subtitle">
                  Redirecting to admin dashboard...
                </span>
              </div>
            </motion.div>
          )}

          <div className="admin-actions">
            <motion.button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiX className="button-icon" />
              CANCEL
            </motion.button>
            
            <motion.button
              type="submit"
              className="submit-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSubmitting}
            >
              <FiSave className="button-icon" />
              {isSubmitting ? 'SAVING...' : 'SAVE'}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default AdminHall; 