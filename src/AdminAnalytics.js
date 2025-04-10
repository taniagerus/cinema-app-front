import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiUsers, FiFilm, FiBarChart2, FiTrendingUp, FiClock, FiAward } from 'react-icons/fi';
import './AdminAnalytics.css';

const API_URL = localStorage.getItem('apiUrl') || 'http://localhost:5252';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    ticketsSold: 0,
    mostPopularMovie: { title: '', ticketsSold: 0, revenue: 0 },
    mostPopularShowtime: { date: '', time: '', movieTitle: '', ticketsSold: 0 },
    lastWeekSales: [],
    movieRevenue: []
  });
  const [dateRange, setDateRange] = useState('week'); // week, month, year
  
  // Add helper function to ensure we have last week sales even if API returns empty
  const ensureLastWeekSales = (data) => {
    // If we have data but no lastWeekSales, create placeholder data
    if (data && (!data.lastWeekSales || data.lastWeekSales.length === 0)) {
      const today = new Date();
      const lastWeek = [];
      
      // Generate the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        lastWeek.push({
          date: date.toISOString().split('T')[0],
          revenue: 0,
          tickets: 0
        });
      }
      
      return {
        ...data,
        lastWeekSales: lastWeek
      };
    }
    
    return data;
  };

  useEffect(() => {
    const checkAuth = () => {
      const userRole = localStorage.getItem('userRole')?.toLowerCase();
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const token = localStorage.getItem('token');

      if (!isAuthenticated || !token || userRole !== 'admin') {
        console.log('Authentication failed in Admin Analytics, redirecting to login');
        localStorage.clear();
        navigate('/login');
        return false;
      }
      return true;
    };

    const fetchSalesData = async () => {
      if (!checkAuth()) return;
      
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        let authToken = token.trim();
        if (!authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        // Fetching sales data for the selected period
        const response = await fetch(`${API_URL}/api/analytics/sales?period=${dateRange}`, {
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sales data: ${response.status} ${response.statusText}`);
        }

        let data = await response.json();
        
        // Ensure we have all needed data structures
        data = ensureLastWeekSales(data);
        
        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setError(`Failed to load sales data: ${error.message}`);
        
        // Using demo data for demonstration purposes
        let demoData = {
          totalRevenue: 12580.50,
          ticketsSold: 278,
          mostPopularMovie: { 
            title: 'Inception', 
            ticketsSold: 89, 
            revenue: 4450.00,
            image: '/path/to/movie-poster.jpg'
          },
          mostPopularShowtime: { 
            date: '2023-04-15', 
            time: '19:30', 
            movieTitle: 'Inception', 
            ticketsSold: 32 
          },
          lastWeekSales: [
            { date: '2023-04-10', revenue: 980.50, tickets: 21 },
            { date: '2023-04-11', revenue: 1250.00, tickets: 25 },
            { date: '2023-04-12', revenue: 1750.00, tickets: 35 },
            { date: '2023-04-13', revenue: 2100.00, tickets: 42 },
            { date: '2023-04-14', revenue: 2450.00, tickets: 49 },
            { date: '2023-04-15', revenue: 2350.00, tickets: 47 },
            { date: '2023-04-16', revenue: 1700.00, tickets: 34 }
          ],
          movieRevenue: [
            { title: 'Inception', revenue: 4450.00, ticketsSold: 89 },
            { title: 'The Dark Knight', revenue: 3200.00, ticketsSold: 64 },
            { title: 'Interstellar', revenue: 2800.00, ticketsSold: 56 },
            { title: 'Oppenheimer', revenue: 2130.50, ticketsSold: 43 }
          ]
        };
        
        // Apply the same data check to demo data
        demoData = ensureLastWeekSales(demoData);
        setSalesData(demoData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [navigate, dateRange]);

  const handleDateRangeChange = (period) => {
    setDateRange(period);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    
    return (
      <>
        <span className="date-day">{day}</span>
        <span className="date-month">{month}</span>
      </>
    );
  };

  const handleGoBack = () => {
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="admin-analytics">
        <div className="analytics-loading">
          <div className="loader"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <motion.div 
        className="analytics-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button className="back-button" onClick={handleGoBack}>
          <FiArrowLeft />
        </button>
        <h1>Sales Analytics</h1>
        <div className="date-range-selector">
          <button 
            className={`range-option ${dateRange === 'week' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('week')}
          >
            Week
          </button>
          <button 
            className={`range-option ${dateRange === 'month' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('month')}
          >
            Month
          </button>
          <button 
            className={`range-option ${dateRange === 'year' ? 'active' : ''}`}
            onClick={() => handleDateRangeChange('year')}
          >
            Year
          </button>
        </div>
      </motion.div>

      {error && (
        <div className="analytics-error">
          <p>{error}</p>
        </div>
      )}

      <div className="analytics-content">
        <motion.div 
          className="stats-cards"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="stat-card revenue">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="stat-value">{formatCurrency(salesData.totalRevenue)}</p>
            </div>
          </div>
          
          <div className="stat-card tickets">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <h3>Tickets Sold</h3>
              <p className="stat-value">{salesData.ticketsSold}</p>
            </div>
          </div>
          
          <div className="stat-card avg-price">
            <div className="stat-icon">
              <FiBarChart2 />
            </div>
            <div className="stat-info">
              <h3>Average Ticket Price</h3>
              <p className="stat-value">
                {salesData.ticketsSold > 0 
                  ? formatCurrency(salesData.totalRevenue / salesData.ticketsSold) 
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="analytics-sections">
          <motion.section 
            className="popular-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2>Most Popular Movie</h2>
            {salesData.mostPopularMovie && (
              <div className="popular-movie">
                <div className="movie-info">
                  <h3>{salesData.mostPopularMovie.title}</h3>
                  <div className="movie-stats">
                    <div className="stat">
                      <FiUsers className="stat-icon" />
                      <span>{salesData.mostPopularMovie.ticketsSold} tickets</span>
                    </div>
                    <div className="stat">
                      <FiDollarSign className="stat-icon" />
                      <span>{formatCurrency(salesData.mostPopularMovie.revenue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.section>

          <motion.section 
            className="sales-performance-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h2>Sales Performance Summary</h2>
            <div className="sales-performance-container">
              {salesData.lastWeekSales.length > 0 ? (
                <div className="sales-metrics-grid">
                  {/* Revenue Trend */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiTrendingUp />
                    </div>
                    <div className="metric-info">
                      <h3>Revenue Trend</h3>
                      {(() => {
                        const firstDay = salesData.lastWeekSales[0];
                        const lastDay = salesData.lastWeekSales[salesData.lastWeekSales.length - 1];
                        const percentChange = firstDay.revenue > 0 
                          ? ((lastDay.revenue - firstDay.revenue) / firstDay.revenue) * 100 
                          : 0;
                        
                        const isPositive = percentChange >= 0;
                        
                        return (
                          <p className={`trend-value ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Peak Day */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiAward />
                    </div>
                    <div className="metric-info">
                      <h3>Best Day</h3>
                      {(() => {
                        const peakDay = [...salesData.lastWeekSales].sort((a, b) => b.revenue - a.revenue)[0];
                        const date = new Date(peakDay.date);
                        
                        return (
                          <p className="metric-value">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Total Revenue */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiDollarSign />
                    </div>
                    <div className="metric-info">
                      <h3>Total Revenue</h3>
                      <p className="metric-value">
                        {formatCurrency(salesData.lastWeekSales.reduce((sum, day) => sum + day.revenue, 0))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Total Tickets */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiUsers />
                    </div>
                    <div className="metric-info">
                      <h3>Total Tickets</h3>
                      <p className="metric-value">
                        {salesData.lastWeekSales.reduce((sum, day) => sum + day.tickets, 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Average Price */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiBarChart2 />
                    </div>
                    <div className="metric-info">
                      <h3>Avg. Ticket Price</h3>
                      <p className="metric-value">
                        {formatCurrency(
                          salesData.lastWeekSales.reduce((sum, day) => sum + day.revenue, 0) / 
                          salesData.lastWeekSales.reduce((sum, day) => sum + day.tickets, 0) || 0
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Average Daily Revenue */}
                  <div className="metric-card">
                    <div className="metric-icon">
                      <FiClock />
                    </div>
                    <div className="metric-info">
                      <h3>Avg. Daily Revenue</h3>
                      <p className="metric-value">
                        {formatCurrency(
                          salesData.lastWeekSales.reduce((sum, day) => sum + day.revenue, 0) / 
                          salesData.lastWeekSales.length
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data-message">
                  <p>No sales performance data available for the selected period</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section 
            className="movies-revenue-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <h2>Movies by Revenue</h2>
            <div className="movies-table">
              <div className="table-header">
                <div className="table-cell">Movie</div>
                <div className="table-cell">Tickets</div>
                <div className="table-cell">Revenue</div>
              </div>
              <div className="table-body">
                {salesData.movieRevenue.length > 0 ? (
                  salesData.movieRevenue.map((movie, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell movie-name">
                        <div className="movie-icon-container">
                          <FiFilm className="movie-icon" />
                        </div>
                        <span title={movie.title}>{movie.title}</span>
                      </div>
                      <div className="table-cell ticket-count">
                        <div className="ticket-badge">{movie.ticketsSold}</div>
                      </div>
                      <div className="table-cell movie-revenue">
                        {formatCurrency(movie.revenue)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-table-message">
                    <p>No movie revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section 
            className="popular-showtime-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <h2>Most Popular Showtime</h2>
            {salesData.mostPopularShowtime && (
              <div className="popular-showtime">
                <div className="showtime-icon">
                  <FiCalendar />
                </div>
                <div className="showtime-info">
                  <h3>{salesData.mostPopularShowtime.movieTitle}</h3>
                  <div className="showtime-details">
                    <div className="date-time">
                      <div className="showtime-date">
                        {new Date(salesData.mostPopularShowtime.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="showtime-time">{salesData.mostPopularShowtime.time}</div>
                    </div>
                    <div className="tickets-sold">
                      <FiUsers className="icon" />
                      <span>{salesData.mostPopularShowtime.ticketsSold} tickets sold</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 