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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';

const CustomerDashboard = () => {
  const my_user = JSON.parse(localStorage.getItem('user'));
const my_user_id = my_user.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openNewAccount, setOpenNewAccount] = useState(false);
  const [openNewLoan, setOpenNewLoan] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newAccountData, setNewAccountData] = useState({
    account_type: 'savings',
    initial_deposit: '',
  });
  const [newLoanData, setNewLoanData] = useState({
    loan_product_id: '',
    amount: '',
    duration: '',
  });
  const [depositData, setDepositData] = useState({
    amount: '',
    account_id: '',
    target_account_number: '',
    deposit_type: 'self', // 'self' or 'other'
  });
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    account_id: '',
  });
  const [loanProducts, setLoanProducts] = useState([]);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState(null);
  const [targetAccount, setTargetAccount] = useState(null);
  const [targetAccountError, setTargetAccountError] = useState('');
  const [loanError, setLoanError] = useState('');
  const [loanSuccess, setLoanSuccess] = useState('');
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const decoded = jwtDecode(token);

        if (!my_user_id ) {
          console.log('Invalid token payload, redirecting to login');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }


        const response = await axios.get(`http://localhost:5000/api/customers/${my_user_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      
        
        if (response.data) {
          // Set the customer data directly from the response
          setCustomer(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 403) {
          setError('You do not have permission to access this data');
        } else if (error.response?.status === 404) {
          setError('Customer profile not found');
        } else {
          setError('Failed to load customer data');
        }
        setLoading(false);
      }
    };

    initializeData();
    fetchLoanProducts();
  }, [navigate]);

  useEffect(() => {
    if (customer) {
      fetchData();
    }
  }, [customer]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch accounts
      const accountsResponse = await axios.get('http://localhost:5000/api/accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const accountsWithNumberBalance = accountsResponse.data.map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0
      }));
      setAccounts(accountsWithNumberBalance);

      // Fetch customer data if not already available
      if (!customer) {
        const decoded = jwtDecode(token);
        const customerResponse = await axios.get(`http://localhost:5000/api/customers/${my_user_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (customerResponse.data) {
          setCustomer(customerResponse.data);
        }
      }

      // Fetch loans for the current customer
      
      if (customer) {
        const loansResponse = await axios.get(`http://localhost:5000/api/loans/customer/${my_user_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    
        setLoans(loansResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/loan_products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoanProducts(response.data.filter(product => product.is_active));
    } catch (error) {
      console.error('Failed to fetch loan products:', error);
      setError('Failed to fetch loan products');
    }
  };

  const handleCreateAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      
      // First, ensure we have customer datac
      console.log("decoded",decoded);
      if (!customer) {
        // Fetch customer data first
        const customerResponse = await axios.get(`http://localhost:5000/api/customers/${my_user_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!customerResponse.data) {
          setError('Customer profile not found. Please try logging in again.');
          return;
        }
        setCustomer(customerResponse.data);
      }

      // Create the account
      const response = await axios.post('http://localhost:5000/api/accounts', {
        ...newAccountData,
        customer_id: customer.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh accounts data
      const accountsResponse = await axios.get('http://localhost:5000/api/accounts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const accountsWithNumberBalance = accountsResponse.data.map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0
      }));
      setAccounts(accountsWithNumberBalance);
      
      setOpenNewAccount(false);
      setNewAccountData({
        account_type: 'savings',
        initial_deposit: '',
      });
    } catch (error) {
      console.error('Error creating account:', error);
      setError(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handleLoanProductChange = (e) => {
    const productId = e.target.value;
    setNewLoanData({ ...newLoanData, loan_product_id: productId });
    const product = loanProducts.find(p => p.id === parseInt(productId));
    setSelectedLoanProduct(product);
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    setLoanError('');
    setLoanSuccess('');

    if (!customer) {
      setLoanError('Customer data not found. Please try again later.');
      return;
    }

    if (!selectedLoanProduct) {
      setLoanError('Please select a loan product');
      return;
    }

    if (!newLoanData.amount || !newLoanData.duration) {
      setLoanError('Please fill in all required fields');
      return;
    }

    try {
      const formData = {
        customerId: my_user_id,
        loanType: selectedLoanProduct.loan_type,
        amount: parseFloat(newLoanData.amount),
        duration: parseInt(newLoanData.duration),
        interestRate: parseFloat(selectedLoanProduct.interest_rate),
        monthlyPayment: parseFloat(newLoanData.amount) / parseInt(newLoanData.duration),
        loan_product_id: parseInt(selectedLoanProduct.id)
      };

      console.log('Submitting loan application with data:', formData);

      const response = await axios.post('http://localhost:5000/api/loans', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Loan application response:', response.data);

      setLoanSuccess('Loan application submitted successfully!');
      setOpenNewLoan(false);
      setNewLoanData({
        loan_product_id: '',
        amount: '',
        duration: ''
      });
      setSelectedLoanProduct(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting loan application:', error);
      setLoanError(error.response?.data?.message || 'Failed to submit loan application');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (openNewAccount) {
      setNewAccountData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (openNewLoan) {
      setNewLoanData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (openDeposit) {
      setDepositData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (openWithdraw) {
      setWithdrawData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDepositTypeChange = (e) => {
    const depositType = e.target.value;
    setDepositData({
      ...depositData,
      deposit_type: depositType,
      account_id: '',
      target_account_number: '',
    });
    setTargetAccount(null);
    setTargetAccountError('');
  };

  const handleTargetAccountChange = async (e) => {
    const accountNumber = e.target.value;
    setDepositData({
      ...depositData,
      target_account_number: accountNumber,
    });

    if (accountNumber) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/accounts/by-number/${accountNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTargetAccount(response.data);
        setTargetAccountError('');
      } catch (error) {
        setTargetAccount(null);
        setTargetAccountError('Account not found');
      }
    } else {
      setTargetAccount(null);
      setTargetAccountError('');
    }
  };

  const handleDeposit = async () => {
    try {
      const token = localStorage.getItem('token');
      let response;

      if (depositData.deposit_type === 'self') {
        response = await axios.post(
          `http://localhost:5000/api/transactions/deposit`,
          { 
            account_id: depositData.account_id,
            amount: parseFloat(depositData.amount),
            description: 'Deposit'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/transactions/transfer`,
          {
            account_id: depositData.account_id,
            amount: parseFloat(depositData.amount),
            target_account_number: depositData.target_account_number,
            description: 'Transfer'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Update accounts list
      const updatedAccounts = accounts.map(account => {
        if (account.id === depositData.account_id) {
          return {
            ...account,
            balance: parseFloat(account.balance) + parseFloat(depositData.amount),
          };
        }
        if (depositData.deposit_type === 'other' && targetAccount && account.id === targetAccount.id) {
          return {
            ...account,
            balance: parseFloat(account.balance) + parseFloat(depositData.amount),
          };
        }
        return account;
      });
      setAccounts(updatedAccounts);

      setOpenDeposit(false);
      setDepositData({
        amount: '',
        account_id: '',
        target_account_number: '',
        deposit_type: 'self',
      });
      setTargetAccount(null);
      setTargetAccountError('');
    } catch (error) {
      setError('Failed to process deposit');
      console.error('Deposit error:', error);
    }
  };

  const handleWithdraw = async () => {
    try {
      const selectedAccount = accounts.find(acc => acc.id === withdrawData.account_id);
      if (!selectedAccount) {
        setError('Account not found');
        return;
      }

      const withdrawalAmount = parseFloat(withdrawData.amount);
      if (withdrawalAmount <= 0) {
        setError('Withdrawal amount must be greater than 0');
        return;
      }

      if (selectedAccount.balance < withdrawalAmount) {
        setError('Insufficient funds');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/transactions/withdraw`,
        { 
          account_id: withdrawData.account_id,
          amount: withdrawalAmount,
          description: 'Withdrawal'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update accounts list
      const updatedAccounts = accounts.map(account => {
        if (account.id === withdrawData.account_id) {
          return {
            ...account,
            balance: parseFloat(account.balance) - withdrawalAmount,
          };
        }
        return account;
      });
      setAccounts(updatedAccounts);

      setOpenWithdraw(false);
      setWithdrawData({
        amount: '',
        account_id: '',
      });
    } catch (error) {
      setError('Failed to process withdrawal');
      console.error('Withdrawal error:', error);
    }
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
        <Typography>Error: {error}</Typography>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Your Banking Dashboard
          </Typography>
          <Typography variant="body1" paragraph>
            It looks like you don't have any accounts yet. Let's get you started by creating your first account!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setOpenNewAccount(true)}
            sx={{ mt: 2 }}
          >
            Create Your First Account
          </Button>
        </Paper>

        <Dialog open={openNewAccount} onClose={() => setOpenNewAccount(false)}>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Account Type</InputLabel>
              <Select
                name="account_type"
                value={newAccountData.account_type}
                onChange={handleChange}
                label="Account Type"
              >
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="current">Current</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Initial Deposit"
              type="number"
              name="initial_deposit"
              value={newAccountData.initial_deposit}
              onChange={handleChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNewAccount(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Accounts" />
          <Tab label="Loans" />
        </Tabs>
      </Box>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      {activeTab === 0 && (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4">My Accounts</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenNewAccount(true)}
                >
                  Create New Account
                </Button>
              </Box>
            </Grid>

            {accounts.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No accounts found</Typography>
                </Paper>
              </Grid>
            ) : (
              accounts.map((account) => (
                <Grid item xs={12} md={6} key={account.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Account #{account.account_number}
                      </Typography>
                      <Typography color="textSecondary">
                        Type: {(account.account_type ? account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1) : 'Unknown')}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 2 }}>
                        Balance: ${(account.balance !== undefined && account.balance !== null) ? parseFloat(account.balance).toFixed(2) : '0.00'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate(`/account/${account.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate(`/transactions/${account.id}`)}
                      >
                        View Transactions
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => {
                          setDepositData({
                            ...depositData,
                            account_id: account.id,
                          });
                          setOpenDeposit(true);
                        }}
                      >
                        Deposit
                      </Button>
                      <Button
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setWithdrawData({
                            ...withdrawData,
                            account_id: account.id,
                          });
                          setOpenWithdraw(true);
                        }}
                      >
                        Withdraw
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Dialog open={openNewAccount} onClose={() => setOpenNewAccount(false)}>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Account Type</InputLabel>
                <Select
                  name="account_type"
                  value={newAccountData.account_type}
                  onChange={handleChange}
                  label="Account Type"
                >
                  <MenuItem value="savings">Savings</MenuItem>
                  <MenuItem value="current">Current</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Initial Deposit"
                type="number"
                name="initial_deposit"
                value={newAccountData.initial_deposit}
                onChange={handleChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenNewAccount(false)}>Cancel</Button>
              <Button onClick={handleCreateAccount} variant="contained">
                Create
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openDeposit} onClose={() => setOpenDeposit(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Deposit Money</DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Deposit Type</FormLabel>
                  <RadioGroup
                    name="deposit_type"
                    value={depositData.deposit_type}
                    onChange={handleDepositTypeChange}
                  >
                    <FormControlLabel value="self" control={<Radio />} label="Deposit to My Account" />
                    <FormControlLabel value="other" control={<Radio />} label="Transfer to Another Account" />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>From Account</InputLabel>
                  <Select
                    name="account_id"
                    value={depositData.account_id}
                    onChange={handleChange}
                    label="From Account"
                    required
                  >
                    <MenuItem value="">
                      <em>Select an account</em>
                    </MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {(account.account_type ? account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1) : 'Unknown')} Account #{account.account_number} - ${(account.balance !== undefined && account.balance !== null) ? parseFloat(account.balance).toFixed(2) : '0.00'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {depositData.deposit_type === 'other' && (
                  <TextField
                    fullWidth
                    label="Target Account Number"
                    name="target_account_number"
                    value={depositData.target_account_number}
                    onChange={handleTargetAccountChange}
                    sx={{ mb: 2 }}
                    required
                    error={!!targetAccountError}
                    helperText={targetAccountError || (targetAccount ? `Account found: ${targetAccount.account_type ? targetAccount.account_type.charAt(0).toUpperCase() + targetAccount.account_type.slice(1) : 'Unknown'} Account` : '')}
                  />
                )}

                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  name="amount"
                  value={depositData.amount}
                  onChange={handleChange}
                  required
                  inputProps={{ min: "0.01", step: "0.01" }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeposit(false)}>Cancel</Button>
              <Button
                onClick={handleDeposit}
                variant="contained"
                color="primary"
                disabled={
                  !depositData.account_id ||
                  !depositData.amount ||
                  (depositData.deposit_type === 'other' && (!depositData.target_account_number || !!targetAccountError))
                }
              >
                {depositData.deposit_type === 'self' ? 'Deposit' : 'Transfer'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={openWithdraw} onClose={() => setOpenWithdraw(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Withdraw Money</DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Account</InputLabel>
                  <Select
                    name="account_id"
                    value={withdrawData.account_id}
                    onChange={handleChange}
                    label="Account"
                    required
                  >
                    <MenuItem value="">
                      <em>Select an account</em>
                    </MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {(account.account_type ? account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1) : 'Unknown')} Account #{account.account_number} - ${(account.balance !== undefined && account.balance !== null) ? parseFloat(account.balance).toFixed(2) : '0.00'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  name="amount"
                  value={withdrawData.amount}
                  onChange={handleChange}
                  required
                  inputProps={{ min: "0.01", step: "0.01" }}
                  helperText={
                    withdrawData.account_id && withdrawData.amount
                      ? `Available balance: $${(accounts.find(acc => acc.id === withdrawData.account_id)?.balance !== undefined && accounts.find(acc => acc.id === withdrawData.account_id)?.balance !== null) ? parseFloat(accounts.find(acc => acc.id === withdrawData.account_id).balance).toFixed(2) : '0.00'}`
                      : ''
                  }
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenWithdraw(false)}>Cancel</Button>
              <Button
                onClick={handleWithdraw}
                variant="contained"
                color="primary"
                disabled={!withdrawData.account_id || !withdrawData.amount}
              >
                Withdraw
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {activeTab === 1 && (
        <>
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

            {loans.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No loans found</Typography>
                </Paper>
              </Grid>
            ) : (
              loans.map(loan => (
                <Grid item xs={12} md={6} key={loan.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {loan?.loanType ? loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) : 'Unknown'} Loan
                      </Typography>
                      <Typography color="textSecondary">
                        Amount: ${loan?.amount ? parseFloat(loan.amount).toLocaleString() : '0.00'}
                      </Typography>
                      <Typography color="textSecondary">
                        Interest Rate: {loan?.interestRate ? loan.interestRate : '0'}%
                      </Typography>
                      <Typography color="textSecondary">
                        Duration: {loan?.duration ? loan.duration : '0'} months
                      </Typography>
                      <Typography color="textSecondary">
                        Monthly Payment: ${loan?.monthlyPayment ? parseFloat(loan.monthlyPayment).toLocaleString() : '0.00'}
                      </Typography>
                      <Typography color="textSecondary">
                        Status: {loan?.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : 'Unknown'}
                      </Typography>
                      {loan?.product && (
                        <>
                          <Typography color="textSecondary">
                            Product: {loan.product.name}
                          </Typography>
                          <Typography color="textSecondary">
                            Description: {loan.product.description}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => navigate(`/loans/${loan.id}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Dialog open={openNewLoan} onClose={() => setOpenNewLoan(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Apply for a Loan</DialogTitle>
            <DialogContent>
              <Box component="form" sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Loan Product</InputLabel>
                  <Select
                    value={newLoanData.loan_product_id}
                    onChange={handleLoanProductChange}
                    label="Loan Product"
                    required
                  >
                    <MenuItem value="">
                      <em>Select a loan product</em>
                    </MenuItem>
                    {loanProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} - {product.loan_type?.charAt(0).toUpperCase() + product.loan_type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedLoanProduct && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Product Details:
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Interest Rate:</strong> {selectedLoanProduct.interest_rate}%
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Amount Range:</strong> ${selectedLoanProduct.min_amount.toLocaleString()} - ${selectedLoanProduct.max_amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Duration Range:</strong> {selectedLoanProduct.min_duration} - {selectedLoanProduct.max_duration} months
                    </Typography>
                    {selectedLoanProduct.description && (
                      <Typography variant="body2" paragraph>
                        <strong>Description:</strong> {selectedLoanProduct.description}
                      </Typography>
                    )}
                    
                    <TextField
                      fullWidth
                      label="Loan Amount"
                      type="number"
                      value={newLoanData.amount}
                      onChange={(e) => setNewLoanData({ ...newLoanData, amount: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                      inputProps={{ 
                        min: selectedLoanProduct.min_amount,
                        max: selectedLoanProduct.max_amount,
                        step: "0.01"
                      }}
                      helperText={`Amount must be between $${selectedLoanProduct.min_amount.toLocaleString()} and $${selectedLoanProduct.max_amount.toLocaleString()}`}
                    />
                    
                    <TextField
                      fullWidth
                      label="Duration (months)"
                      type="number"
                      value={newLoanData.duration}
                      onChange={(e) => setNewLoanData({ ...newLoanData, duration: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                      inputProps={{ 
                        min: selectedLoanProduct.min_duration,
                        max: selectedLoanProduct.max_duration
                      }}
                      helperText={`Duration must be between ${selectedLoanProduct.min_duration} and ${selectedLoanProduct.max_duration} months`}
                    />
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenNewLoan(false)}>Cancel</Button>
              <Button
                onClick={handleLoanSubmit}
                variant="contained"
                color="primary"
                disabled={!newLoanData.loan_product_id || !newLoanData.amount || !newLoanData.duration}
              >
                Apply for Loan
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default CustomerDashboard;