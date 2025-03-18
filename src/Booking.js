import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiClock, FiMonitor } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './Booking.css';

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movie || {
    id: 1,
    title: 'Dune: Part Two',
    year: 2024,
    rating: 8.7,
    duration: '166 min',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg'
  };
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState('19:40');
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Available showtimes
  const showtimes = ['14:30', '17:15', '19:40', '22:00'];
  
  // Current date
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('default', { month: 'short' }).toUpperCase();
  
  // Generate seats
  const generateSeats = () => {
    const rows = 8;
    const seatsPerRow = 12;
    const seats = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let seat = 0; seat < seatsPerRow; seat++) {
        // Add some predefined booked seats
        const isBooked = (row === 3 && seat >= 4 && seat <= 7) || 
                        (row === 4 && seat >= 4 && seat <= 7) ||
                        Math.random() < 0.2; // 20% chance of being booked
        
        rowSeats.push({
          id: `${row + 1}-${seat + 1}`,
          row: row + 1,
          seat: seat + 1,
          isBooked,
          price: 15
        });
      }
      seats.push(rowSeats);
    }
    
    return seats;
  };
  
  const [seats] = useState(generateSeats());
  
  const handleSeatClick = (rowIndex, seatIndex) => {
    const seat = seats[rowIndex][seatIndex];
    
    if (seat.isBooked) return;
    
    const seatId = `${rowIndex + 1}-${seatIndex + 1}`;
    const isSeatSelected = selectedSeats.some(s => s.id === seatId);
    
    if (isSeatSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seatId));
      setTotalPrice(totalPrice - seat.price);
    } else {
      setSelectedSeats([...selectedSeats, { 
        id: seatId, 
        row: rowIndex + 1, 
        seat: seatIndex + 1,
        price: seat.price
      }]);
      setTotalPrice(totalPrice + seat.price);
    }
  };
  
  const handleTimeClick = (time) => {
    setSelectedTime(time);
  };
  
  const handleContinue = () => {
    // Navigate to payment page or show confirmation
    console.log('Booking details:', {
      movie,
      seats: selectedSeats,
      time: selectedTime,
      date: `${day} ${month}`,
      totalPrice
    });
    
    // For now, just go back to home
    navigate('/');
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  const isSeatSelected = (rowIndex, seatIndex) => {
    const seatId = `${rowIndex + 1}-${seatIndex + 1}`;
    return selectedSeats.some(s => s.id === seatId);
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <motion.div 
          className="booking-header"
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
          <h1 className="movie-title">{movie.title}</h1>
        </motion.div>
        
        <div className="booking-content">
          <div className="booking-left">
            <motion.div 
              className="movie-poster-container"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img src={movie.poster} alt={movie.title} className="movie-poster" />
            </motion.div>
            
            <motion.div 
              className="selected-seats-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3>Selected Seats</h3>
              {selectedSeats.length === 0 ? (
                <p className="no-seats">No seats selected</p>
              ) : (
                <div className="selected-seats-list">
                  {selectedSeats.map(seat => (
                    <div key={seat.id} className="selected-seat-item">
                      <span>Row {seat.row}, Seat {seat.seat}</span>
                      <span>${seat.price}</span>
                    </div>
                  ))}
                  <div className="total-price">
                    <span>Total:</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          <div className="booking-right">
            <motion.div 
              className="booking-info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="info-item">
                <div className="info-icon">
                  <FiCalendar />
                </div>
                <div className="info-text">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{day} {month}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FiClock />
                </div>
                <div className="info-text">
                  <span className="info-label">Time:</span>
                  <span className="info-value">{selectedTime}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FiMonitor />
                </div>
                <div className="info-text">
                  <span className="info-label">Screen:</span>
                  <span className="info-value">IMAX 3D</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="time-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3>Select Time</h3>
              <div className="time-slots">
                {showtimes.map(time => (
                  <motion.button
                    key={time}
                    className={`time-slot ${time === selectedTime ? 'active' : ''}`}
                    onClick={() => handleTimeClick(time)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {time}
                  </motion.button>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className="seating-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3>Select Seats</h3>
              
              <div className="screen-container">
                <div className="screen"></div>
                <p className="screen-label">SCREEN</p>
              </div>
              
              <div className="seating-layout">
                {seats.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="seat-row">
                    {row.map((seat, seatIndex) => (
                      <motion.div
                        key={`seat-${rowIndex}-${seatIndex}`}
                        className={`seat ${seat.isBooked ? 'booked' : ''} ${isSeatSelected(rowIndex, seatIndex) ? 'selected' : ''}`}
                        onClick={() => handleSeatClick(rowIndex, seatIndex)}
                        whileHover={!seat.isBooked ? { scale: 1.2 } : {}}
                        whileTap={!seat.isBooked ? { scale: 0.9 } : {}}
                      />
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="seat-sample available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="seat-sample selected"></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="seat-sample booked"></div>
                  <span>Booked</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="booking-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <motion.button
                className="cancel-button"
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                CANCEL
              </motion.button>
              
              <motion.button
                className="continue-button"
                onClick={handleContinue}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={selectedSeats.length === 0}
              >
                NEXT
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
