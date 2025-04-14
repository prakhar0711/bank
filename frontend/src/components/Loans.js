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
  Fade,
  Grow,
  Zoom,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 0.1,
    zIndex: 0,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)',
  },
  '&.MuiButton-contained': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    },
  },
  '&.MuiButton-outlined': {
    borderWidth: '2px',
    '&:hover': {
      borderWidth: '2px',
    },
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    padding: theme.spacing(3),
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
    },
  },
  marginBottom: theme.spacing(3),
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: '12px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[300],
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  marginBottom: theme.spacing(3),
}));

const LoanCard = ({ loan, navigate }) => (
  <Grow in={true} timeout={500}>
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {loan.LoanType.charAt(0).toUpperCase() + loan.LoanType.slice(1)} Loan
          </Typography>
          <Chip
            label={loan.Status}
            color={getStatusColor(loan.Status)}
            size="small"
            sx={{ 
              borderRadius: '8px',
              borderWidth: '2px',
              fontWeight: 600,
            }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ₹{parseFloat(loan.Amount).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <PercentIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Interest Rate
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {loan.InterestRate}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {loan.DurationMonths} months
                </Typography>
              </Box>
            </Box>
          </Grid>
          {loan.Status === 'approved' && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Payment
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹{calculateMonthlyPayment(loan.Amount, loan.InterestRate, loan.DurationMonths)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <CardActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Zoom in={true} timeout={600}>
          <StyledButton
            size="small"
            variant="outlined"
            onClick={() => navigate(`/loans/${loan.LoanID}`)}
            startIcon={<AccountBalanceIcon />}
          >
            View Details
          </StyledButton>
        </Zoom>
      </CardActions>
    </StyledCard>
  </Grow>
);

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
    <StyledContainer maxWidth="lg">
      <Fade in={true} timeout={500}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              My Loans
            </Typography>
            <StyledButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewLoan(true)}
            >
              Apply for Loan
            </StyledButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {loans.length === 0 ? (
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Loans Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Apply for a loan to get started with your financial goals
                    </Typography>
                    <StyledButton
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenNewLoan(true)}
                    >
                      Apply for Loan
                    </StyledButton>
                  </CardContent>
                </StyledCard>
              </Grid>
            ) : (
              loans.map((loan) => (
                <Grid item xs={12} md={6} key={loan.LoanID}>
                  <LoanCard loan={loan} navigate={navigate} />
                </Grid>
              ))
            )}
          </Grid>

          <StyledDialog open={openNewLoan} onClose={() => setOpenNewLoan(false)}>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Apply for Loan</Typography>
                <IconButton onClick={() => setOpenNewLoan(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Loan Type</InputLabel>
                  <StyledSelect
                    name="loanType"
                    value={newLoanData.loanType}
                    onChange={handleChange}
                    label="Loan Type"
                  >
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="education">Education</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                  </StyledSelect>
                </FormControl>
                <StyledTextField
                  fullWidth
                  label="Amount"
                  type="number"
                  name="amount"
                  value={newLoanData.amount}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <StyledTextField
                  fullWidth
                  label="Interest Rate"
                  type="number"
                  name="interestRate"
                  value={newLoanData.interestRate}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
                <StyledTextField
                  fullWidth
                  label="Duration"
                  type="number"
                  name="durationMonths"
                  value={newLoanData.durationMonths}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">months</InputAdornment>,
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <StyledButton onClick={() => setOpenNewLoan(false)}>Cancel</StyledButton>
              <StyledButton
                onClick={handleCreateLoan}
                variant="contained"
                disabled={!newLoanData.loanType || !newLoanData.amount || !newLoanData.interestRate || !newLoanData.durationMonths}
              >
                Apply
              </StyledButton>
            </DialogActions>
          </StyledDialog>
        </Box>
      </Fade>
    </StyledContainer>
  );
};

export default Loans; 