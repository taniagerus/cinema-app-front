import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiFilm, FiClock, FiUsers, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('token');

    console.log('Admin Dashboard Auth Check:', {
      userRole,
      isAuthenticated,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });

    if (!isAuthenticated || !token || userRole !== 'admin') {
      console.log('Authentication failed in Admin Dashboard, redirecting to login');
      localStorage.clear(); // Clear all auth data if validation fails
      navigate('/login');
      return;
    }

    console.log('Admin authentication successful, showing dashboard');
  }, [navigate]);

  const menuItems = [
    {
      title: 'Add Movie',
      icon: <FiFilm />,
      path: '/admin/movie',
      description: 'Create new movie with poster and description'
    },
    {
      title: 'Manage Showtimes',
      icon: <FiClock />,
      path: '/admin/showtime',
      description: 'Add and edit movie showtimes'
    },
    {
      title: 'Users',
      icon: <FiUsers />,
      path: '/admin/users',
      description: 'Manage users and their permissions'
    },
    {
      title: 'Statistics',
      icon: <FiBarChart2 />,
      path: '/admin/statistics',
      description: 'View sales and attendance statistics'
    },
    {
      title: 'Settings',
      icon: <FiSettings />,
      path: '/admin/settings',
      description: 'General system settings'
    }
  ];

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.clear();
    
    // Navigate to login page
    navigate('/login', { replace: true });
    
    // Reload the page to reset all states
    window.location.reload();
  };

  const handleNavigation = (path) => {
    const userRole = localStorage.getItem('userRole')?.toLowerCase();
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('token');

    console.log('Navigation check for path:', path, {
      userRole,
      isAuthenticated,
      hasToken: !!token
    });

    if (!isAuthenticated || !token || userRole !== 'admin') {
      console.log('Session expired or invalid during navigation, redirecting to login');
      localStorage.clear();
      navigate('/login');
      return;
    }

    console.log('Navigating to admin path:', path);
    navigate(path);
  };

  return (
    <div className="admin-dashboard">
      <motion.div 
        className="admin-sidebar"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="admin-logo">
          <h1>CINEMATIX</h1>
          <p>Admin Dashboard</p>
        </div>
        
        <motion.button 
          className="logout-button"
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLogOut />
          Logout
        </motion.button>
      </motion.div>

      <div className="admin-main">
        <motion.h1 
          className="welcome-text"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Welcome to Admin Dashboard
        </motion.h1>

        <div className="admin-grid">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              className="admin-card"
              onClick={() => handleNavigation(item.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="card-icon">
                {item.icon}
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 