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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Fade,
  Grow,
  Zoom,
  LinearProgress,
  IconButton,
  InputAdornment,
  CircularProgress,
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
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoanProducts from './LoanProducts';
import {
  Line,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: '100vh',
  position: 'relative',
  width: '100%',
  maxWidth: '100% !important',
  margin: 0,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
    zIndex: -1,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    opacity: 0.1,
    zIndex: -1,
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  maxWidth: theme.breakpoints.values.lg,
  margin: '0 auto',
  padding: theme.spacing(0, 2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(0, 3),
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    height: 4,
    borderRadius: '2px',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
  minHeight: 48,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const StyledTable = styled(TableContainer)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  '& .MuiTableHead-root': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '& .MuiTableCell-head': {
      color: 'white',
      fontWeight: 600,
    },
  },
  '& .MuiTableBody-root': {
    '& .MuiTableRow-root:hover': {
      background: 'rgba(102, 126, 234, 0.04)',
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

const FeatureItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& svg': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(2),
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
  },
}));

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch customers for both admin and employees
      const customersResponse = await axios.get('http://localhost:5000/api/customers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCustomers(customersResponse.data);

      // Fetch loans
      const loansResponse = await axios.get('http://localhost:5000/api/loans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLoans(loansResponse.data);
      console.log(loans);
    } catch (error) {
      setError('Failed to fetch data');
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoanAction = async (loanId, action) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5000/api/loans/${loanId}/status`, {
        status: action
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh loans data
      const loansResponse = await axios.get('http://localhost:5000/api/loans', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLoans(loansResponse.data);
      
      setOpenLoanDialog(false);
      setSelectedLoan(null);
    } catch (error) {
      setError('Failed to update loan status');
      console.error('API Error:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewLoanDetails = (loan) => {
    setSelectedLoan(loan);
    setOpenLoanDialog(true);
  };

  const fetchTransactionData = async (customerId) => {
    try {
      setLoadingTransactions(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/transactions/customer/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
console.log(response)
      // Process transaction data for the chart
      const transactions = response.data;
      const monthlyData = {};
      
      transactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            deposits: 0,
            withdrawals: 0,
            count: 0
          };
        }
        
        if (transaction.transaction_type === 'deposit') {
          monthlyData[monthYear].deposits += parseFloat(transaction.amount);
        } else if (transaction.transaction_type === 'withdrawal') {
          monthlyData[monthYear].withdrawals += parseFloat(transaction.amount);
        }
        monthlyData[monthYear].count++;
      });

      // Prepare chart data
      const labels = Object.keys(monthlyData).sort();
      const chartData = {
        labels,
        datasets: [
          {
            label: 'Deposits',
            data: labels.map(label => monthlyData[label].deposits),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1
          },
          {
            label: 'Withdrawals',
            data: labels.map(label => monthlyData[label].withdrawals),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          },
          {
            label: 'Number of Transactions',
            data: labels.map(label => monthlyData[label].count),
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      };

      setTransactionData(chartData);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      setError('Failed to fetch transaction data');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleViewCustomerDetails = async (customer) => {
    setSelectedCustomer(customer);
    setOpenCustomerDialog(true);
    await fetchTransactionData(customer.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
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

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <StyledContainer>
      <ContentContainer>
        <Box>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <StyledTabs value={activeTab} onChange={handleTabChange}>
              <StyledTab label="Loan Applications" icon={<TrendingUpIcon />} />
              <StyledTab label="Customers" icon={<PersonIcon />} />
              <StyledTab label="Loan Products" icon={<AccountBalanceIcon />} />
            </StyledTabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <ProgressBar sx={{ width: '100%', maxWidth: 400 }} />
            </Box>
          ) : (
            <>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StyledCard>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Loan Applications
                        </Typography>
                        <StyledTable>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {loans.map((loan) => (
                                <TableRow key={loan.id}>
                                  <TableCell>{loan.id}</TableCell>
                                  <TableCell>
                                    {loan ? `${loan.first_name} ${loan.last_name}` : 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    {loan.loan_type.charAt(0).toUpperCase() + loan.loan_type.slice(1)}
                                  </TableCell>
                                  <TableCell>${parseFloat(loan.amount).toLocaleString()}</TableCell>
                                  <TableCell>{loan.duration} months</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                      color={getStatusColor(loan.status)}
                                      sx={{ borderRadius: '8px' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <StyledButton
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleViewLoanDetails(loan)}
                                    >
                                      Review
                                    </StyledButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </StyledTable>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                </Grid>
              )}

              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <StyledCard>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                          Customers
                        </Typography>
                        <StyledTable>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Accounts</TableCell>
                                <TableCell>Loans</TableCell>
                                <TableCell>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                  <TableCell>{customer.id}</TableCell>
                                  <TableCell>
                                    {customer.first_name} {customer.last_name}
                                  </TableCell>
                                  <TableCell>{customer.email}</TableCell>
                                  <TableCell>{customer.phone}</TableCell>
                                  <TableCell>{customer.accounts?.length || 0}</TableCell>
                                  <TableCell>{customer.loans?.length || 0}</TableCell>
                                  <TableCell>
                                    <StyledButton
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleViewCustomerDetails(customer)}
                                    >
                                      View Details
                                    </StyledButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </StyledTable>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                </Grid>
              )}

              {activeTab === 2 && <LoanProducts />}
            </>
          )}

          {/* Loan Review Dialog */}
          <StyledDialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Review Loan Application</Typography>
                <IconButton onClick={() => setOpenLoanDialog(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedLoan && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Loan Details
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <MoneyIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Loan Amount
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          ${parseFloat(selectedLoan.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <PercentIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Interest Rate
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan.interest_rate}%
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <CalendarIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan.duration} months
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <EventIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Application Date
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {new Date(selectedLoan.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                      Customer Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <PersonIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan ? `${selectedLoan.first_name} ${selectedLoan.last_name}` : 'N/A'}
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <EmailIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan?.email || 'N/A'}
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <PhoneIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <LocationIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedLoan ? `${selectedLoan.street}, ${selectedLoan.city}, ${selectedLoan.state}, ${selectedLoan.postal_code}, ${selectedLoan.country}` : 'N/A'}
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <StyledButton onClick={() => setOpenLoanDialog(false)}>Close</StyledButton>
              {selectedLoan && selectedLoan.status === 'pending' && (
                <>
                  <StyledButton
                    color="error"
                    onClick={() => handleLoanAction(selectedLoan.id, 'rejected')}
                  >
                    Reject
                  </StyledButton>
                  <StyledButton
                    color="success"
                    onClick={() => handleLoanAction(selectedLoan.id, 'approved')}
                  >
                    Approve
                  </StyledButton>
                </>
              )}
            </DialogActions>
          </StyledDialog>

          {/* Customer Details Dialog */}
          <StyledDialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Customer Details</Typography>
                <IconButton onClick={() => setOpenCustomerDialog(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedCustomer && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Personal Information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <PersonIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedCustomer.first_name} {selectedCustomer.last_name}
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <EmailIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedCustomer.email}
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FeatureItem>
                      <PhoneIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedCustomer.phone}
                        </Typography>
                      </Box>
                    </FeatureItem>
                    <FeatureItem>
                      <EventIcon />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedCustomer.date_of_birth ? new Date(selectedCustomer.date_of_birth).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </FeatureItem>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                      Accounts
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      {selectedCustomer.accounts?.map((account) => (
                        <React.Fragment key={account.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    Account Number: {account.account_number}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Balance: ${parseFloat(account.balance).toLocaleString()}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Status: {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                      {(!selectedCustomer.accounts || selectedCustomer.accounts.length === 0) && (
                        <ListItem>
                          <ListItemText primary="No accounts found" />
                        </ListItem>
                      )}
                    </List>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                      Loans
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <List>
                      {selectedCustomer.loans?.map((loan) => (
                        <React.Fragment key={loan.id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {loan.loan_type.charAt(0).toUpperCase() + loan.loan_type.slice(1)} Loan
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    Amount: ${parseFloat(loan.amount).toLocaleString()}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Status: {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Duration: {loan.duration} months
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                      {(!selectedCustomer.loans || selectedCustomer.loans.length === 0) && (
                        <ListItem>
                          <ListItemText primary="No loans found" />
                        </ListItem>
                      )}
                    </List>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                      Transaction History
                    </Typography>
                    {loadingTransactions ? (
                      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <CircularProgress />
                      </Box>
                    ) : transactionData ? (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                        <LineChart
                          data={transactionData}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              title: {
                                display: true,
                                text: 'Monthly Transaction Summary'
                              }
                            },
                            scales: {
                              y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                  display: true,
                                  text: 'Amount ($)'
                                }
                              },
                              y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                  display: true,
                                  text: 'Number of Transactions'
                                },
                                grid: {
                                  drawOnChartArea: false
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Typography color="text.secondary" align="center">
                        No transaction data available
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <StyledButton onClick={() => setOpenCustomerDialog(false)}>Close</StyledButton>
            </DialogActions>
          </StyledDialog>
        </Box>
      </ContentContainer>
    </StyledContainer>
  );
};

export default EmployeeDashboard; 