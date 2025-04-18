import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiClock, FiMonitor, FiUser, FiGlobe, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './Booking.css';

// Add these utility functions at the top
const calculateEndTime = (startTime, durationInMinutes) => {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationInMinutes * 60000);
  return end;
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movie;
  const selectedShowtime = location.state?.showtime;
  
  // Get API URL from localStorage or use default
  const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showtimes, setShowtimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [seats, setSeats] = useState([]);
  const [hallData, setHallData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isReserving, setIsReserving] = useState(false);
  const [allMovieShowtimes, setAllMovieShowtimes] = useState([]);
  const [otherMovies, setOtherMovies] = useState([]);
  
  // Current date
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('default', { month: 'short' }).toUpperCase();
  
  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (!isAuthenticated || !token) {
        // Save current booking state
        localStorage.setItem('bookingState', JSON.stringify({
          movie,
          selectedSeats,
          selectedTime,
          totalPrice,
          returnUrl: '/booking'
        }));
        
        navigate('/login', { state: { from: '/booking' } });
      }
    };
    
    checkAuth();
  }, [movie, selectedSeats, selectedTime, totalPrice, navigate]);

  // Fetch hall data and seats when showtime is selected
  useEffect(() => {
    const fetchHallData = async () => {
      if (!selectedTime?.hallId) return;

      try {
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
        setHallData(hallData);

        // Organize seats into rows
        const organizedSeats = [];
        for (let row = 1; row <= hallData.rows; row++) {
          const rowSeats = hallData.seats
            .filter(seat => seat.rowNumber === row)
            .sort((a, b) => a.seatNumber - b.seatNumber);
          organizedSeats.push(rowSeats);
        }
        setSeats(organizedSeats);

      } catch (error) {
        console.error('Error fetching hall data:', error);
        setError('Failed to load hall configuration');
      }
    };

    fetchHallData();
  }, [selectedTime, API_URL]);

  // Fetch showtimes
  useEffect(() => {
    const fetchAllShowtimes = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        let authToken = token?.trim();
        if (authToken && !authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        // Fetch all showtimes
        const response = await fetch(`${API_URL}/api/showtimes`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch showtimes');
        }
        
        const data = await response.json();
        
        // Fetch all movies to get their details
        const moviesResponse = await fetch(`${API_URL}/api/movies`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!moviesResponse.ok) {
          throw new Error('Failed to fetch movies');
        }

        const moviesData = await moviesResponse.json();
        const moviesMap = new Map(moviesData.map(m => [m.id, m]));
        
        // Organize showtimes by date and add movie details
        const enhancedShowtimes = data.map(showtime => ({
          ...showtime,
          movie: moviesMap.get(showtime.movieId),
          endTime: calculateEndTime(showtime.startTime, moviesMap.get(showtime.movieId)?.durationInMinutes || 0)
        })).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        // Split into current movie and other movies' showtimes
        const currentMovieShowtimes = enhancedShowtimes.filter(st => st.movieId === movie.id);
        const otherMoviesShowtimes = enhancedShowtimes.filter(st => st.movieId !== movie.id);
        
        setShowtimes(currentMovieShowtimes);
        setAllMovieShowtimes(enhancedShowtimes);
        setOtherMovies(Array.from(new Set(otherMoviesShowtimes.map(st => st.movie))));
        
        if (selectedShowtime) {
          setSelectedTime(selectedShowtime);
        }
      } catch (error) {
        console.error('Error fetching showtimes:', error);
        setError('Failed to load showtimes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllShowtimes();
  }, [movie, selectedShowtime, API_URL]);

  // Extract unique dates
  useEffect(() => {
    if (showtimes.length > 0) {
      const dates = [...new Set(showtimes.map(showtime => 
        new Date(showtime.startTime).toLocaleDateString('en-US')
      ))];
      setUniqueDates(dates);
      setSelectedDate(dates[0]);
    }
  }, [showtimes]);

  // Fetch reservations when showtime is selected
  useEffect(() => {
    const fetchReservations = async () => {
      if (!selectedTime?.id) return;

      try {
        const token = localStorage.getItem('token');
        let authToken = token?.trim();
        if (authToken && !authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        // Use the specific endpoint for getting reserved seats
        const response = await fetch(`${API_URL}/api/reserve/showtime/${selectedTime.id}/seats`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            navigate('/login', { state: { from: '/booking' } });
            return;
          }
          throw new Error('Failed to fetch reservations');
        }

        const reservedSeatIds = await response.json();
        // Update seats with reservation status
        if (seats.length > 0) {
          const updatedSeats = seats.map(row =>
            row.map(seat => ({
              ...seat,
              isReserved: reservedSeatIds.includes(seat.id)
            }))
          );
          setSeats(updatedSeats);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setError('Failed to load seat reservations');
      }
    };

    fetchReservations();
  }, [selectedTime, API_URL, navigate, seats]);

  // Update seat availability based on reservations
  useEffect(() => {
    if (seats.length > 0 && reservations.length > 0) {
      const updatedSeats = seats.map(row =>
        row.map(seat => ({
          ...seat,
          isReserved: reservations.some(r => r.seatId === seat.id)
        }))
      );
      setSeats(updatedSeats);
    }
  }, [reservations, seats]);

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  if (!movie) {
    return (
      <div className="booking-error">
        <h2>Movie information not found</h2>
        <button onClick={() => navigate('/')} className="back-button">
          Return to Home
        </button>
      </div>
    );
  }
  
  const handleSeatClick = (seat) => {
    // Don't allow clicking on reserved seats
    if (seat.isReserved) {
      setError('This seat is already reserved');
      return;
    }
    
    const isSeatSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSeatSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      setTotalPrice(prevPrice => prevPrice - selectedTime.price);
    } else {
      setSelectedSeats([...selectedSeats, seat]);
      setTotalPrice(prevPrice => prevPrice + selectedTime.price);
    }
    setError(''); // Clear any previous errors
  };
  
  const handleTimeClick = (time) => {
    setSelectedTime(time);
    setSelectedSeats([]);
    setTotalPrice(0);
  };
  
  const handleContinue = async () => {
    if (selectedSeats.length === 0 || !selectedTime) {
      setError('Please select at least one seat');
      return;
    }

    setIsReserving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      let authToken = token?.trim();
      if (authToken && !authToken.startsWith('Bearer ')) {
        authToken = `Bearer ${authToken}`;
      }

      // Create reservations for all selected seats
      const reservationPromises = selectedSeats.map(async seat => {
        const reservationData = {
          showtimeId: selectedTime.id,
          userId: userId,
          seatId: seat.id
        };
        
        const response = await fetch(`${API_URL}/api/reserve`, {
          method: 'POST',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reservationData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create reservation');
        }

        return response.json();
      });

      const reservationResults = await Promise.all(reservationPromises);

      // Check for failed reservations
      if (reservationResults.some(result => !result || result.error)) {
        throw new Error('Failed to create some reservations');
      }

      // Calculate total price including booking fee
      const bookingFee = 1.50;
      const totalPriceWithFee = totalPrice + bookingFee;

      // Map the seats with their reservation IDs
      const seatsWithReservations = selectedSeats.map((seat, index) => ({
        ...seat,
        reservationId: reservationResults[index].id
      }));

      // Prepare booking details
      const paymentState = {
        bookingDetails: {
          movie: {
            ...movie,
            image: movie.image
          },
          seats: seatsWithReservations,
          showtime: {
            id: selectedTime.id,
            startTime: selectedTime.startTime,
            price: selectedTime.price
          },
          totalPrice: totalPrice,
          bookingFee: bookingFee,
          finalTotal: totalPriceWithFee,
          reservationTime: new Date().toISOString()
        }
      };

      // Save booking details to localStorage
      localStorage.setItem('pendingPayment', JSON.stringify(paymentState));
      
      // Complete the reserving state
      setIsReserving(false);

      // Use window.location for hard navigation
      window.location.href = '/payment';

    } catch (error) {
      console.error('Error creating reservations:', error);
      setError(error.message || 'Failed to reserve seats. Please try again.');
      setIsReserving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  const isSeatSelected = (seat) => {
    return selectedSeats.some(s => s.id === seat.id);
  };

  // Update the time slots rendering in the return statement
  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    const dateShowtimes = allMovieShowtimes.filter(showtime => 
      new Date(showtime.startTime).toLocaleDateString('en-US') === selectedDate
    );

    if (dateShowtimes.length === 0) {
      return (
        <div className="no-showtimes-message">
          <div className="message-content">
            <span className="message-title">No sessions available</span>
            <span className="message-subtitle">Please select another date to see available showtimes</span>
          </div>
        </div>
      );
    }

    // Group showtimes by movie
    const movieGroups = {};
    dateShowtimes.forEach(showtime => {
      if (!movieGroups[showtime.movieId]) {
        movieGroups[showtime.movieId] = [];
      }
      movieGroups[showtime.movieId].push(showtime);
    });

    return Object.entries(movieGroups).map(([movieId, movieShowtimes]) => {
      const movieData = movieShowtimes[0].movie;
      const isCurrentMovie = movieId === movie.id.toString();

      return (
        <div key={movieId} className={`movie-showtime-group ${isCurrentMovie ? 'current-movie' : 'other-movie'}`}>
          <div className="time-slots">
            {movieShowtimes.map(showtime => (
              <motion.button
                key={showtime.id}
                className={`time-slot ${selectedTime?.id === showtime.id ? 'active' : ''}`}
                onClick={() => handleTimeClick(showtime)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={new Date(showtime.startTime) < new Date()}
              >
                <div className="time-slot-time">
                  {formatTime(showtime.startTime)}
                </div>
                <div className="time-slot-end">
                  Ends {formatTime(showtime.endTime)}
                </div>
                <div className="time-slot-price">
                  ${showtime.price}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      );
    });
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
              transition={{ duration: 0.5 }}
            >
              <img 
                src={`${API_URL}${movie.image}`} 
                alt={movie.title} 
                className="movie-poster"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-movie.jpg';
                }}
              />
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
                      <span>Row {seat.rowNumber}, Seat {seat.seatNumber}</span>
                      <span>${selectedTime ? selectedTime.price : 0}</span>
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
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{movie.durationInMinutes} min</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FiUser />
                </div>
                <div className="info-text">
                  <span className="info-label">Age Rating:</span>
                  <span className="info-value">{movie.ageRating}+</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <FiGlobe />
                </div>
                <div className="info-text">
                  <span className="info-label">Language:</span>
                  <span className="info-value">{movie.language}</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="date-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3>Select Date</h3>
              <div className="date-slider">
                <motion.div className="dates-container">
                  {uniqueDates.map((date, index) => (
                    <motion.button
                      key={date}
                      className={`date-item ${selectedDate === date ? 'active' : ''}`}
                      onClick={() => setSelectedDate(date)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="date-day">
                        {formatDateForDisplay(date)}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              className="time-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3>Select Time</h3>
              {isLoading ? (
                <div className="loading-message">Loading available times...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <div className="all-showtimes-container">
                  {renderTimeSlots()}
                </div>
              )}
            </motion.div>
            
            <motion.div 
              className="seating-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3>Select Seats</h3>
              
              <div className="screen-container">
                <div className="screen"></div>
                <p className="screen-label">SCREEN</p>
              </div>
              
              {selectedTime ? (
                <div className="seating-layout">
                  {seats.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="seat-row">
                      {row.map((seat) => (
                        <motion.div
                          key={seat.id}
                          className={`seat ${!seat.isAvailable || seat.isReserved ? 'booked' : ''} ${isSeatSelected(seat) ? 'selected' : ''}`}
                          onClick={() => handleSeatClick(seat)}
                          whileHover={seat.isAvailable && !seat.isReserved ? { scale: 1.2 } : {}}
                          whileTap={seat.isAvailable && !seat.isReserved ? { scale: 0.9 } : {}}
                        >
                          <span className="seat-number">{seat.seatNumber}</span>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-showtime-message">
                  Please select a showtime to view available seats
                </div>
              )}
              
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
            
            {error && <div className="error-message">{error}</div>}
            
            <motion.div 
              className="booking-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
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
                disabled={selectedSeats.length === 0 || !selectedTime || isReserving}
              >
                {isReserving ? 'RESERVING...' : 'NEXT'}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;