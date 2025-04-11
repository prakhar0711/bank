import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import CustomerDashboard from './components/CustomerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import AccountDetails from './components/AccountDetails';
import Transactions from './components/Transactions';
import LoanDetails from './components/LoanDetails';
import LoanProducts from './components/LoanProducts';
import MessagePopup from './components/MessagePopup';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const DashboardRoute = () => {
  const { user } = useAuth();
  
  if (user.role === 'employee') {
    return <EmployeeDashboard />;
  }
  
  return <CustomerDashboard />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MessagePopup />
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/:id"
            element={
              <ProtectedRoute>
                <AccountDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:accountId"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans/:id"
            element={
              <ProtectedRoute>
                <LoanDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loan_products"
            element={
              <ProtectedRoute>
                <LoanProducts />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 