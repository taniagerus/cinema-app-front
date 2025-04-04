import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCreditCard, FiUser, FiCalendar, FiLock, FiCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './Payment.css';

const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const loadBookingDetails = () => {
      try {
        const savedPayment = localStorage.getItem('pendingPayment');
        if (!savedPayment) {
          navigate('/', { replace: true });
          return;
        }

        const parsedPayment = JSON.parse(savedPayment);
        if (!parsedPayment.bookingDetails) {
          navigate('/', { replace: true });
          return;
        }

        setBookingDetails(parsedPayment.bookingDetails);
      } catch (error) {
        console.error('Error loading booking details:', error);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingDetails();
  }, [navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading-message">Loading payment details...</div>
        </div>
      </div>
    );
  }

  // Show error if no booking details
  if (!bookingDetails) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="error-message">Booking details not found</div>
          <button onClick={() => navigate('/')} className="back-button">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCVCChange = (e) => {
    const cvc = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardCVC(cvc);
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      console.log(`Checking current status for ticket ${ticketId}`);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      // Спочатку отримуємо поточний статус квитка
      const ticketResponse = await fetch(`${API_URL}/api/ticket/${ticketId}`, {
        headers: {
          'Authorization': authToken
        }
      });

      if (!ticketResponse.ok) {
        throw new Error('Failed to get ticket status');
      }

      const ticket = await ticketResponse.json();
      console.log(`Current ticket status: ${ticket.status}`);

      // Перевіряємо, чи потрібно оновлювати статус
      if (ticket.status === newStatus) {
        console.log(`Ticket ${ticketId} already has status ${newStatus}`);
        return;
      }

      console.log(`Updating ticket ${ticketId} status from ${ticket.status} to ${newStatus}`);

      // Якщо статус відрізняється, оновлюємо його
      const response = await fetch(`${API_URL}/api/ticket/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStatus)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating ticket status:', errorData);
        throw new Error(errorData.error || 'Failed to update ticket status');
      }

      console.log(`Successfully updated ticket ${ticketId} status to ${newStatus}`);
    } catch (error) {
      console.error(`Error updating ticket ${ticketId} status:`, error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!cardName.trim()) {
      newErrors.cardName = 'Enter cardholder name';
    }
    
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Enter valid card number';
    }
    
    if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
      newErrors.cardExpiry = 'Enter valid date (MM/YY)';
    } else {
      const [month] = cardExpiry.split('/');
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.cardExpiry = 'Invalid month';
      }
    }
    
    if (!cardCVC.trim() || cardCVC.length < 3) {
      newErrors.cardCVC = 'Enter valid CVC code';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const processPayment = async (reserveId, price) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reserveId: reserveId,
          paymentMethod: 'CreditCard',
          cardDetails: {
            lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
            cardholderName: cardName
          },
          price: price
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
      }

      const paymentData = await response.json();
      return paymentData;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  };

  const getExistingTicket = async (reservationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_URL}/api/ticket/reserve/${reservationId}`, {
        headers: {
          'Authorization': authToken
        }
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('Error checking existing ticket:', error);
      return null;
    }
  };

  const createOrGetTicket = async (reservationId) => {
    try {
      console.log(`Checking existing ticket for reservation ${reservationId}`);
      const token = localStorage.getItem('token');
      console.log('Token available:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Спочатку перевіряємо, чи існує квиток
      const existingTicket = await getExistingTicket(reservationId);
      if (existingTicket) {
        console.log(`Found existing ticket for reservation ${reservationId}:`, existingTicket);
        return existingTicket;
      }

      console.log(`No existing ticket found, creating new ticket for reservation ${reservationId}`);

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }
      console.log('Using authorization header:', authToken.substring(0, 20) + '...');

      const response = await fetch(`${API_URL}/api/ticket`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reserveId: reservationId
        })
      });

      const responseData = await response.json();
      console.log(`Create ticket response:`, responseData);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token'); // Clear invalid token
          throw new Error('Authentication expired. Please log in again.');
        }
        if (response.status === 400 && responseData.error?.includes('already exists')) {
          console.log('Ticket already exists, retrying to get existing ticket');
          const retryExistingTicket = await getExistingTicket(reservationId);
          if (retryExistingTicket) {
            return retryExistingTicket;
          }
        }
        throw new Error(responseData.error || 'Failed to create ticket');
      }

      return responseData;
    } catch (error) {
      console.error('Error in createOrGetTicket:', error);
      throw error;
    }
  };

  const downloadTicketPdf = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token available for PDF download:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      let authToken = token.trim();
      if (!authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }
      console.log('Using authorization header for PDF:', authToken.substring(0, 20) + '...');

      const response = await fetch(`${API_URL}/api/ticket/${ticketId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': authToken,
          'Accept': 'application/pdf'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        // Більш детальна обробка різних типів помилок
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          throw new Error('Сеанс закінчився. Увійдіть у систему знову.');
        }
        
        if (response.status === 403) {
          console.error('Помилка доступу:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('Доступ заборонено. Перевірте свій статус входу.');
        }
        
        const errorData = await response.json().catch(() => null);
        console.error('PDF download error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(errorData?.error || 'Не вдалося завантажити квиток');
      }

      // Перевірка правильного типу вмісту
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Неправильний формат відповіді. Очікувався PDF.');
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
      
      console.log(`Successfully downloaded PDF for ticket ID: ${ticketId}`);
      return true;
    } catch (error) {
      console.error('Error downloading ticket:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError('');
    
    try {
    if (!validateForm()) {
        setIsProcessing(false);
      return;
    }
    
      const bookingDetails = JSON.parse(localStorage.getItem('pendingPayment'))?.bookingDetails;
      if (!bookingDetails) {
        throw new Error('Booking details not found');
      }

      console.log('Початок процесу оплати з деталями бронювання:', bookingDetails);

      // Обробляємо кожне місце послідовно
      const results = [];
      for (const seat of bookingDetails.seats) {
        try {
          console.log(`Обробка місця ${seat.seatNumber} в ряду ${seat.rowNumber}`);
          
          // Спочатку створюємо платіж
          console.log(`Обробка оплати для бронювання ${seat.reservationId}`);
          const paymentResponse = await processPayment(seat.reservationId, bookingDetails.showtime.price);
          console.log(`Платіж оброблено:`, paymentResponse);

          // Потім створюємо або отримуємо квиток
          console.log(`Створення/отримання квитка для бронювання ${seat.reservationId}`);
          const ticketResponse = await createOrGetTicket(seat.reservationId);
          console.log(`Відповідь створення квитка:`, ticketResponse);

          if (ticketResponse.id) {
            // Оновлюємо статус квитка
            await updateTicketStatus(ticketResponse.id, 'Paid');
            
            // Додаємо ID квитка до результатів
            results.push({
              ...seat,
              ticketId: ticketResponse.id,
              success: true
            });
          }
        } catch (error) {
          console.error(`Помилка обробки місця ${seat.seatNumber}:`, error);
          results.push({
            ...seat,
            success: false,
            error: error.message
          });
        }
      }

      console.log('Всі результати обробки:', results);

      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        throw new Error(`Failed to process ${failures.length} tickets. Please contact support.`);
      }

      // Оновлюємо дані бронювання з ID квитків
      const updatedBookingDetails = {
        ...bookingDetails,
        seats: results.map(result => ({
          ...result,
          ticketId: result.ticketId,
          rowNumber: result.rowNumber,
          seatNumber: result.seatNumber
        }))
      };

      // Зберігаємо оновлені дані для сторінки підтвердження
      localStorage.setItem('bookingDetails', JSON.stringify(updatedBookingDetails));
      
      // Очищаємо дані очікуючого платежу
      localStorage.removeItem('pendingPayment');
      
      setIsPaymentComplete(true);
      setIsProcessing(false);

      // Автоматично завантажуємо PDF-квитки
      try {
        for (const result of results) {
          if (result.success && result.ticketId) {
            await downloadTicketPdf(result.ticketId);
            // Додаємо невелику затримку між завантаженнями
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error('Error downloading tickets:', error);
      }

      // Використовуємо navigate замість window.location
      navigate('/confirmation', { replace: true });

    } catch (error) {
      console.error('Помилка оплати або створення квитка:', error);
      setPaymentError(error.message || 'Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatSeats = (seats) => {
    return seats.map(seat => `Ряд ${seat.rowNumber}, Місце ${seat.seatNumber}`).join(', ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <motion.div 
          className="payment-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button 
            className="back-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            disabled={isProcessing || isPaymentComplete}
          >
            <FiArrowLeft />
          </motion.button>
          <h1>Payment</h1>
        </motion.div>
        
        <div className="payment-content">
          <div className="payment-left">
            <motion.div 
              className="order-summary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3>Order Details</h3>
              <div className="movie-summary">
                <img 
                  src={`${API_URL}${bookingDetails.movie.image}`} 
                  alt={bookingDetails.movie.title} 
                  className="movie-thumbnail"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-movie.jpg';
                  }}
                />
                <div className="movie-details">
                  <h4>{bookingDetails.movie.title}</h4>
                  <p>Date: {formatDate(bookingDetails.showtime.startTime)}</p>
                  <p>Time: {formatTime(bookingDetails.showtime.startTime)}</p>
                  <p>Seats: {formatSeats(bookingDetails.seats)}</p>
                </div>
              </div>
              
              <div className="price-summary">
                <div className="price-item">
                  <span>Tickets ({bookingDetails?.seats?.length || 0})</span>
                  <span>${(bookingDetails?.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="price-item">
                  <span>Service Fee</span>
                  <span>${(bookingDetails?.bookingFee || 0).toFixed(2)}</span>
                </div>
                <div className="price-item total">
                  <span>Total Amount</span>
                  <span>${(bookingDetails?.finalTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="payment-right">
            {isPaymentComplete ? (
              <motion.div 
                className="payment-success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="success-icon">
                  <FiCheck />
                </div>
                <h2>Payment Successful!</h2>
                <p>Your tickets have been booked successfully.</p>
                <p>Redirecting to confirmation page...</p>
              </motion.div>
            ) : (
              <motion.form 
                className="payment-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3>Card Details</h3>
                
                {paymentError && (
                  <div className="error-message payment-error">
                    {paymentError}
                  </div>
                )}
                
                <div className="form-group">
                  <label>
                    <FiUser className="input-icon" />
                    <span>Cardholder Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Smith"
                    disabled={isProcessing}
                    className={errors.cardName ? 'error' : ''}
                  />
                  {errors.cardName && <span className="error-message">{errors.cardName}</span>}
                </div>
                
                <div className="form-group">
                  <label>
                    <FiCreditCard className="input-icon" />
                    <span>Номер картки</span>
                  </label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    disabled={isProcessing}
                    className={errors.cardNumber ? 'error' : ''}
                  />
                  {errors.cardNumber && <span className="error-message">{errors.cardNumber}</span>}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <FiCalendar className="input-icon" />
                      <span>Термін дії</span>
                    </label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      disabled={isProcessing}
                      className={errors.cardExpiry ? 'error' : ''}
                    />
                    {errors.cardExpiry && <span className="error-message">{errors.cardExpiry}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <FiLock className="input-icon" />
                      <span>CVC</span>
                    </label>
                    <input 
                      type="text" 
                      value={cardCVC}
                      onChange={handleCVCChange}
                      placeholder="123"
                      disabled={isProcessing}
                      className={errors.cardCVC ? 'error' : ''}
                    />
                    {errors.cardCVC && <span className="error-message">{errors.cardCVC}</span>}
                  </div>
                </div>
                
                <div className="payment-actions">
                  <motion.button
                    type="button"
                    className="cancel-button"
                    onClick={handleBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isProcessing}
                  >
                    CANCEL
                  </motion.button>
                  
                  <motion.button
                    type="submit"
                    className="pay-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'PROCESSING...' : `PAY $${(bookingDetails?.finalTotal || 0).toFixed(2)}`}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment; 