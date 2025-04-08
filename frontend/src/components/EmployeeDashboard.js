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
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoanProducts from './LoanProducts';

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

  const handleViewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setOpenCustomerDialog(true);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Loan Applications" />
          <Tab label="Customers" />
          <Tab label="Loan Products" />
        </Tabs>
      </Box>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Loan Applications
              </Typography>
              <TableContainer>
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
                          {loan.customer ? `${loan.customer.first_name} ${loan.customer.last_name}` : 'N/A'}
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
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewLoanDetails(loan)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Customers
              </Typography>
              <TableContainer>
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
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewCustomerDetails(customer)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <LoanProducts />
      )}

      {/* Loan Review Dialog */}
      <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Loan Application</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">Loan Details</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Loan ID:</strong> {selectedLoan.id}</Typography>
                <Typography><strong>Type:</strong> {selectedLoan.loan_type.charAt(0).toUpperCase() + selectedLoan.loan_type.slice(1)}</Typography>
                <Typography><strong>Amount:</strong> ${parseFloat(selectedLoan.amount).toLocaleString()}</Typography>
                <Typography><strong>Interest Rate:</strong> {selectedLoan.interest_rate}%</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Duration:</strong> {selectedLoan.duration} months</Typography>
                <Typography><strong>Monthly Payment:</strong> ${parseFloat(selectedLoan.monthly_payment).toLocaleString()}</Typography>
                <Typography><strong>Status:</strong> {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}</Typography>
                <Typography><strong>Application Date:</strong> {new Date(selectedLoan.created_at).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Customer Information</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Name:</strong> {selectedLoan.customer ? `${selectedLoan.customer.first_name} ${selectedLoan.customer.last_name}` : 'N/A'}</Typography>
                <Typography><strong>Email:</strong> {selectedLoan.customer?.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Phone:</strong> {selectedLoan.customer?.phone || 'N/A'}</Typography>
                <Typography><strong>Address:</strong> {selectedLoan.customer?.address || 'N/A'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoanDialog(false)}>Close</Button>
          {selectedLoan && selectedLoan.status === 'pending' && (
            <>
              <Button
                color="error"
                onClick={() => handleLoanAction(selectedLoan.id, 'rejected')}
              >
                Reject
              </Button>
              <Button
                color="success"
                onClick={() => handleLoanAction(selectedLoan.id, 'approved')}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">Personal Information</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</Typography>
                <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>
                <Typography><strong>Phone:</strong> {selectedCustomer.phone}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Address:</strong> {selectedCustomer.address || 'N/A'}</Typography>
                <Typography><strong>Date of Birth:</strong> {selectedCustomer.date_of_birth ? new Date(selectedCustomer.date_of_birth).toLocaleDateString() : 'N/A'}</Typography>
                <Typography><strong>Gender:</strong> {selectedCustomer.gender || 'N/A'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Accounts</Typography>
              </Grid>
              <Grid item xs={12}>
                <List>
                  {selectedCustomer.accounts?.map((account) => (
                    <React.Fragment key={account.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Account Number: {account.account_number}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Balance: ${parseFloat(account.balance).toLocaleString()}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
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
                <Typography variant="h6" sx={{ mt: 2 }}>Loans</Typography>
              </Grid>
              <Grid item xs={12}>
                <List>
                  {selectedCustomer.loans?.map((loan) => (
                    <React.Fragment key={loan.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${loan.loan_type.charAt(0).toUpperCase() + loan.loan_type.slice(1)} Loan`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Amount: ${parseFloat(loan.amount).toLocaleString()}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Status: {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
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
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCustomerDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployeeDashboard; 