import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const AccountDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccountDetails();
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAccount(response.data);
    } catch (error) {
      setError('Failed to fetch account details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 2 }}>Account not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Account Details</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/transactions/${id}`)}
          >
            View Transactions
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Account Information</Typography>
            <Typography><strong>Account Number:</strong> {account.account_number}</Typography>
            <Typography><strong>Type:</strong> {account.account_type === 'current' ? 'Current' : account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}</Typography>
            <Typography><strong>Balance:</strong> ₹{parseFloat(account.balance).toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Account Status</Typography>
            <Typography><strong>Status:</strong> Active</Typography>
            <Typography><strong>Created:</strong> {new Date(account.created_at).toLocaleDateString()}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AccountDetails; 