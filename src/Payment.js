import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCreditCard, FiUser, FiCalendar, FiLock, FiCheck } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './Payment.css';

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingDetails = location.state?.bookingDetails || {
    movie: {
      title: 'Dune: Part Two',
      poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'
    },
    seats: [{ id: '1-1', row: 1, seat: 1, price: 15 }],
    time: '19:40',
    date: '24 JUN',
    totalPrice: 15
  };

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Limit to 16 digits + 3 spaces
  };

  const formatExpiry = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as MM/YY
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
    // Only allow digits and limit to 3-4 characters
    const cvc = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardCVC(cvc);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }
    
    if (!cardNumber.trim() || cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Valid card number is required';
    }
    
    if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
      newErrors.cardExpiry = 'Valid expiry date is required (MM/YY)';
    } else {
      const [month, year] = cardExpiry.split('/');
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.cardExpiry = 'Invalid month';
      }
    }
    
    if (!cardCVC.trim() || cardCVC.length < 3) {
      newErrors.cardCVC = 'Valid CVC is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentComplete(true);
      
      // Redirect to confirmation after 2 seconds
      setTimeout(() => {
        navigate('/confirmation', { 
          state: { 
            bookingDetails,
            paymentDetails: {
              cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
              cardName
            }
          } 
        });
      }, 2000);
    }, 2000);
  };

  const handleBack = () => {
    navigate(-1);
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
              <h3>Order Summary</h3>
              <div className="movie-summary">
                <img 
                  src={bookingDetails.movie.poster} 
                  alt={bookingDetails.movie.title} 
                  className="movie-thumbnail" 
                />
                <div className="movie-details">
                  <h4>{bookingDetails.movie.title}</h4>
                  <p>Date: {bookingDetails.date}</p>
                  <p>Time: {bookingDetails.time}</p>
                  <p>Seats: {bookingDetails.seats.map(seat => `R${seat.row}-S${seat.seat}`).join(', ')}</p>
                </div>
              </div>
              <div className="price-summary">
                <div className="price-item">
                  <span>Tickets ({bookingDetails.seats.length})</span>
                  <span>${bookingDetails.totalPrice.toFixed(2)}</span>
                </div>
                <div className="price-item">
                  <span>Booking Fee</span>
                  <span>$1.50</span>
                </div>
                <div className="price-item total">
                  <span>Total</span>
                  <span>${(bookingDetails.totalPrice + 1.50).toFixed(2)}</span>
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
                
                <div className="form-group">
                  <label>
                    <FiUser className="input-icon" />
                    <span>Cardholder Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    disabled={isProcessing}
                    className={errors.cardName ? 'error' : ''}
                  />
                  {errors.cardName && <span className="error-message">{errors.cardName}</span>}
                </div>
                
                <div className="form-group">
                  <label>
                    <FiCreditCard className="input-icon" />
                    <span>Card Number</span>
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
                      <span>Expiry Date</span>
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
                    {isProcessing ? 'PROCESSING...' : `PAY $${(bookingDetails.totalPrice + 1.50).toFixed(2)}`}
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