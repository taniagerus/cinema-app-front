import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaDownload, FaHome, FaTicketAlt, FaCalendarAlt, FaClock, FaCouch, FaDollarSign, FaFilm, FaMapMarkerAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Confirmation.css';

const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

const Confirmation = () => {
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloadingTickets, setDownloadingTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookingDetails = () => {
      const details = localStorage.getItem('bookingDetails');
      if (!details) {
        navigate('/', { replace: true });
        return;
      }
      try {
        const parsedDetails = JSON.parse(details);
        setBookingDetails(parsedDetails);
      } catch (error) {
        console.error('Error parsing booking details:', error);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingDetails();
  }, [navigate]);

  const formatDate = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      setDownloadError('');
      setDownloadingTickets(prev => [...prev, ticketId]);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      // Спочатку перевіряємо доступ до квитка
      const checkResponse = await fetch(`${API_URL}/api/ticket/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': authToken
        }
      });

      if (!checkResponse.ok) {
        if (checkResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          localStorage.setItem('returnUrl', '/confirmation');
          navigate('/login', { replace: true });
          throw new Error('Your session has expired. Please log in again.');
        }
        
        if (checkResponse.status === 403) {
          throw new Error('You do not have permission to access this ticket. Please login again.');
        }
      }

      // Тепер завантажуємо PDF
      console.log(`Requesting PDF for ticket ${ticketId}`);
      const response = await fetch(`${API_URL}/api/ticket/${ticketId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Accept': 'application/pdf'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          localStorage.setItem('returnUrl', '/confirmation');
          navigate('/login', { replace: true });
          throw new Error('Your session has expired. Please log in again.');
        }
        if (response.status === 403) {
          console.error('Access denied error:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('You do not have permission to access this ticket. Please login again.');
        }
        throw new Error(`Failed to download ticket (${response.status})`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response format. Expected PDF.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movie-ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`Successfully downloaded ticket ${ticketId}`);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      setDownloadError(error.message);
    } finally {
      setDownloadingTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  const handleDownloadAllTickets = async () => {
    if (!bookingDetails || !bookingDetails.seats || bookingDetails.seats.length === 0) {
      setDownloadError('No tickets available');
      return;
    }

    setDownloadError('');
    const allTicketIds = bookingDetails.seats.map(seat => seat.ticketId);
    setDownloadingTickets(allTicketIds);

    let hasErrors = false;
    let errorMessage = '';

    try {
      for (const seat of bookingDetails.seats) {
        if (!seat.ticketId) continue;
        
        try {
          await handleDownloadTicket(seat.ticketId);
          // Додаємо невелику затримку між завантаженнями
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          hasErrors = true;
          errorMessage = error.message;
          console.error(`Error processing ticket for seat ${seat.seatNumber}:`, error);
          // Продовжуємо завантаження інших квитків, навіть якщо поточний не вдалося завантажити
        }
      }

      if (hasErrors) {
        setDownloadError(errorMessage || 'Some tickets could not be downloaded. Please try downloading them individually.');
      }
    } catch (error) {
      console.error('Error downloading all tickets:', error);
      setDownloadError(error.message || 'Failed to download tickets');
    } finally {
      setDownloadingTickets([]);
    }
  };

  const handleGoHome = () => {
    localStorage.removeItem('bookingDetails');
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <motion.div 
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loader"></div>
            <h2>Loading booking details...</h2>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <motion.div 
            className="error-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaTicketAlt className="error-icon" />
            <h2>Booking information not found</h2>
            <p>We couldn't find your booking details. Please try again or make a new reservation.</p>
            <motion.button 
              className="home-button"
              onClick={handleGoHome}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaHome /> Return to Home
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <motion.div 
        className="confirmation-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="confirmation-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.3,
              type: "spring",
              stiffness: 200
            }}
          >
            <FaCheck />
          </motion.div>
          <h1>Booking Confirmed!</h1>
          <p>Your tickets are ready for download</p>
        </motion.div>

        <motion.div 
          className="booking-details"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="movie-info">
            <div className="movie-poster-container">
              <img
                src={`${API_URL}${bookingDetails.movie.image}`}
                alt={bookingDetails.movie.title}
                className="movie-poster"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-movie.jpg';
                }}
              />
              <div className="movie-age-rating">{bookingDetails.movie.ageRating || 'G'}</div>
            </div>
            <div className="movie-details">
              <h2>{bookingDetails.movie.title}</h2>
              <div className="movie-meta">
                <span className="movie-duration">{bookingDetails.movie.duration} min</span>
                <span className="movie-language">{bookingDetails.movie.language}</span>
              </div>
              
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon-container">
                    <FaCalendarAlt className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Date</span>
                    <span className="info-value">{formatDate(bookingDetails.showtime.startTime)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon-container">
                    <FaClock className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Time</span>
                    <span className="info-value">{formatTime(bookingDetails.showtime.startTime)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon-container">
                    <FaMapMarkerAlt className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Hall</span>
                    <span className="info-value">Hall {bookingDetails.showtime.hallId}</span>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon-container">
                    <FaDollarSign className="info-icon" />
                  </div>
                  <div className="info-content">
                    <span className="info-label">Total</span>
                    <span className="info-value">${bookingDetails.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="seats-summary">
            <h3>
              <FaCouch className="section-icon" />
              <span>Your Seats ({bookingDetails.seats.length})</span>
            </h3>
            <div className="seats-grid">
              {bookingDetails.seats.map(seat => (
                <div key={seat.ticketId} className="seat-item">
                  <div className="seat-marker">
                    <FaCouch className="seat-icon" />
                    <span className="seat-identifier">Row {seat.rowNumber}, Seat {seat.seatNumber}</span>
                  </div>
                  <div className="seat-price">${bookingDetails.showtime.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
            
            <div className="price-summary">
              <div className="price-row subtotal">
                <span>Subtotal</span>
                <span>${bookingDetails.totalPrice.toFixed(2)}</span>
              </div>
              <div className="price-row fee">
                <span>Booking Fee</span>
                <span>${bookingDetails.bookingFee.toFixed(2)}</span>
              </div>
              <div className="price-row total">
                <span>Total</span>
                <span>${bookingDetails.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="ticket-downloads">
            <h3>
              <FaTicketAlt className="section-icon" />
              <span>Your Tickets</span>
            </h3>
            <motion.button
              className="download-all-button"
              onClick={handleDownloadAllTickets}
              disabled={downloadingTickets.length > 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaTicketAlt />
              {downloadingTickets.length > 0 ? 'Downloading...' : 'Download All Tickets'}
            </motion.button>
            
            <div className="tickets-grid">
              {bookingDetails.seats.map((seat) => (
                <motion.button
                  key={seat.ticketId}
                  className={`download-button ${downloadingTickets.includes(seat.ticketId) ? 'downloading' : ''}`}
                  onClick={() => handleDownloadTicket(seat.ticketId)}
                  disabled={downloadingTickets.includes(seat.ticketId)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaDownload className="download-icon" />
                  {downloadingTickets.includes(seat.ticketId) 
                    ? 'Downloading...' 
                    : `Ticket - Row ${seat.rowNumber}, Seat ${seat.seatNumber}`}
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence>
              {downloadError && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {downloadError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            className="home-button"
            onClick={handleGoHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaHome /> Return to Home
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Confirmation; 