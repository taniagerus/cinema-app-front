import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCalendar, FiClock, FiMapPin, FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

function UserProfile() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

  const fetchMovieDetails = async (movieId, authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/movies/${movieId}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  };

  const fetchShowtimeDetails = async (showtimeId, authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/showtimes/${showtimeId}`, {
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching showtime details:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const isAuthenticated = localStorage.getItem('isAuthenticated');

        if (!token || !userId || !isAuthenticated) {
          localStorage.setItem('returnUrl', '/profile');
          navigate('/login');
          return;
        }

        // Ensure token format
        token = token.trim();
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        // Fetch user information
        const userResponse = await fetch(`${API_URL}/api/users/${userId}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          if (userResponse.status === 403 || userResponse.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('isAuthenticated');
            localStorage.setItem('returnUrl', '/profile');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        setUserInfo(userData);

        // Fetch user's tickets
        try {
          const ticketsResponse = await fetch(`${API_URL}/api/ticket/user/${userId}`, {
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json'
            }
          });

          if (ticketsResponse.ok) {
            const ticketsData = await ticketsResponse.json();
            
            // Fetch additional details for each ticket
            const ticketsWithDetails = await Promise.all(
              ticketsData.map(async (ticket) => {
                if (ticket.reserve && ticket.reserve.showtime) {
                  const showtime = await fetchShowtimeDetails(ticket.reserve.showtime.id, authToken);
                  if (showtime && showtime.movieId) {
                    const movie = await fetchMovieDetails(showtime.movieId, authToken);
                    return {
                      ...ticket,
                      reserve: {
                        ...ticket.reserve,
                        showtime: {
                          ...ticket.reserve.showtime,
                          ...showtime,
                          movie: movie
                        }
                      }
                    };
                  }
                }
                return ticket;
              })
            );

            // Filter future tickets
            const futureTickets = ticketsWithDetails.filter(ticket => 
              ticket.reserve?.showtime?.startTime && new Date(ticket.reserve.showtime.startTime) > new Date()
            );
            
            setTickets(futureTickets);
          } else {
            console.error('Failed to fetch tickets:', ticketsResponse.statusText);
            setTickets([]);
          }
        } catch (ticketError) {
          console.error('Error fetching tickets:', ticketError);
          setTickets([]);
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [API_URL, navigate]);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const downloadTicketPdf = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await fetch(`${API_URL}/api/ticket/${ticketId}/pdf`, {
        headers: {
          'Authorization': authToken
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket_${ticketId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download ticket PDF');
      }
    } catch (error) {
      console.error('Error downloading ticket PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="user-profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="error">
          {error}
          <button 
            onClick={() => navigate('/login')} 
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="user-profile-container">
        <div className="error">Unable to load user information</div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <motion.div 
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-avatar">
          <FiUser size={40} />
        </div>
        <div className="profile-info">
          <h1>{userInfo?.name || 'User'}</h1>
          <p className="username">@{userInfo?.userName || 'username'}</p>
          <p className="age">{userInfo?.age ? `${userInfo.age} years old` : 'Age not specified'}</p>
        </div>
      </motion.div>

      <motion.div 
        className="future-tickets-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2>Upcoming Movies</h2>
        {!tickets || tickets.length === 0 ? (
          <div className="no-tickets">
            <p>No upcoming movie tickets</p>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <motion.div 
                key={ticket?.id || Math.random()}
                className="ticket-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="ticket-movie-image">
                  <img 
                    src={ticket?.reserve?.showtime?.movie?.image ? `${API_URL}${ticket.reserve.showtime.movie.image}` : '/placeholder-movie.jpg'} 
                    alt={ticket?.reserve?.showtime?.movie?.title || 'Movie'}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-movie.jpg';
                    }}
                  />
                </div>
                <div className="ticket-info">
                  <h3>{ticket?.reserve?.showtime?.movie?.title || 'Unknown Movie'}</h3>
                  <div className="ticket-details">
                    <div className="detail-item">
                      <FiCalendar />
                      <span>{ticket?.reserve?.showtime?.startTime ? formatDate(ticket.reserve.showtime.startTime) : 'Date not available'}</span>
                    </div>
                    <div className="detail-item">
                      <FiClock />
                      <span>{ticket?.reserve?.showtime?.startTime ? formatTime(ticket.reserve.showtime.startTime) : 'Time not available'}</span>
                    </div>
                    <div className="detail-item">
                      <FiMapPin />
                      <span>Hall {ticket?.reserve?.seat?.hall?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="seat-info">
                    Seat: Row {ticket?.reserve?.seat?.rowNumber || '?'}, Seat {ticket?.reserve?.seat?.seatNumber || '?'}
                  </div>
                  {ticket.status === 'Paid' && (
                    <button 
                      className="download-ticket"
                      onClick={() => downloadTicketPdf(ticket.id)}
                    >
                      <FiDownload /> Download Ticket
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default UserProfile; 