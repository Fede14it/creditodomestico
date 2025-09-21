import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-wallet me-2"></i>
          CreditoDomestico
        </Link>
        
        <div className="navbar-nav ms-auto">
          {isLoading ? (
            <div className="spinner-border spinner-border-sm text-light" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>
          ) : isAuthenticated ? (
            <>
              <span className="navbar-text me-3">
                <i className="fas fa-user me-1"></i>
                {user?.email}
              </span>
              <button
                className="btn btn-outline-light"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                <i className="fas fa-sign-in-alt me-1"></i>
                Accedi
              </Link>
              <Link className="nav-link" to="/register">
                <i className="fas fa-user-plus me-1"></i>
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 