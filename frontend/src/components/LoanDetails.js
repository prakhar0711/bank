import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchLoanDetails();
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [loanResponse, paymentsResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/loans/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(`http://localhost:5000/api/loans/${id}/payments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);
      setLoan(loanResponse.data);
      setPayments(paymentsResponse.data);
    } catch (error) {
      setError('Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'active':
        return 'info';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!loan) {
    return (
      <Container>
        <Alert severity="error">Loan not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        variant="outlined"
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {loan.loan_type.charAt(0).toUpperCase() + loan.loan_type.slice(1)} Loan
          </Typography>
          <Chip
            label={loan.status}
            color={getStatusColor(loan.status)}
            size="large"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Loan Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Loan ID</Typography>
              <Typography variant="body1">{loan.id}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Amount</Typography>
              <Typography variant="body1">
                ${parseFloat(loan.amount).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Interest Rate</Typography>
              <Typography variant="body1">{loan.interest_rate}%</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Duration</Typography>
              <Typography variant="body1">{loan.duration} months</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Application Date</Typography>
              <Typography variant="body1">{formatDate(loan.created_at)}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Payment Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Monthly Payment</Typography>
              <Typography variant="body1">
                ${parseFloat(loan.monthly_payment).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Total Interest</Typography>
              <Typography variant="body1">
                ${parseFloat(loan.amount * loan.interest_rate / 100).toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography color="textSecondary">Total Amount</Typography>
              <Typography variant="body1">
                ${parseFloat(loan.amount + (loan.amount * loan.interest_rate / 100)).toFixed(2)}
              </Typography>
            </Box>
            {loan.status === 'approved' && (
              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary">Next Payment Date</Typography>
                <Typography variant="body1">
                  {formatDate(new Date(loan.created_at).setMonth(new Date(loan.created_at).getMonth() + 1))}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {payments && payments.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Principal</TableCell>
                    <TableCell>Interest</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>${parseFloat(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(payment.principal).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(payment.interest).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={payment.status === 'paid' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default LoanDetails; 