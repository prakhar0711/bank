// src/components/Header.js
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="container nav-container">
        <div className="nav-logo">Banking System</div>

        {user ? (
          <div className="nav-links">
            {user.role === "customer" ? (
              <Link to="/customer/dashboard" className="nav-link">
                Dashboard
              </Link>
            ) : (
              <Link to="/employee/dashboard" className="nav-link">
                Dashboard
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <Link to="/login" className="nav-link">
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
