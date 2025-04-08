import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Loans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewLoan, setOpenNewLoan] = useState(false);
  const [newLoanData, setNewLoanData] = useState({
    loanType: 'personal',
    amount: '',
    interestRate: '',
    durationMonths: '',
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/loans/customer/${user.userId}`);
      setLoans(response.data);
    } catch (error) {
      setError('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/loans', {
        ...newLoanData,
        customerId: user.userId,
      });
      setLoans([...loans, response.data.loan]);
      setOpenNewLoan(false);
      setNewLoanData({
        loanType: 'personal',
        amount: '',
        interestRate: '',
        durationMonths: '',
      });
    } catch (error) {
      setError('Failed to create loan application');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewLoanData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const calculateMonthlyPayment = (amount, interestRate, durationMonths) => {
    const monthlyRate = interestRate / 100 / 12;
    const payment = amount * monthlyRate * Math.pow(1 + monthlyRate, durationMonths) / (Math.pow(1 + monthlyRate, durationMonths) - 1);
    return payment.toFixed(2);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">My Loans</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenNewLoan(true)}
            >
              Apply for Loan
            </Button>
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {loans.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No loans found</Typography>
            </Paper>
          </Grid>
        ) : (
          loans.map((loan) => (
            <Grid item xs={12} md={6} key={loan.LoanID}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      {loan.LoanType.charAt(0).toUpperCase() + loan.LoanType.slice(1)} Loan
                    </Typography>
                    <Chip
                      label={loan.Status}
                      color={getStatusColor(loan.Status)}
                      size="small"
                    />
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    Amount: ${parseFloat(loan.Amount).toFixed(2)}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Interest Rate: {loan.InterestRate}%
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Duration: {loan.DurationMonths} months
                  </Typography>
                  {loan.Status === 'approved' && (
                    <Typography color="textSecondary" gutterBottom>
                      Monthly Payment: $
                      {calculateMonthlyPayment(
                        loan.Amount,
                        loan.InterestRate,
                        loan.DurationMonths
                      )}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/loans/${loan.LoanID}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* New Loan Dialog */}
      <Dialog open={openNewLoan} onClose={() => setOpenNewLoan(false)}>
        <DialogTitle>Apply for Loan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Loan Type</InputLabel>
            <Select
              name="loanType"
              value={newLoanData.loanType}
              onChange={handleChange}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="home">Home</MenuItem>
              <MenuItem value="car">Car</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="business">Business</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Amount"
            type="number"
            name="amount"
            value={newLoanData.amount}
            onChange={handleChange}
            InputProps={{
              startAdornment: <Typography>$</Typography>,
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Interest Rate (%)"
            type="number"
            name="interestRate"
            value={newLoanData.interestRate}
            onChange={handleChange}
            InputProps={{
              endAdornment: <Typography>%</Typography>,
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Duration (months)"
            type="number"
            name="durationMonths"
            value={newLoanData.durationMonths}
            onChange={handleChange}
            InputProps={{
              endAdornment: <Typography>months</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewLoan(false)}>Cancel</Button>
          <Button onClick={handleCreateLoan} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Loans; 