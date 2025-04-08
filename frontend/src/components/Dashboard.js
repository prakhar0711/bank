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
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewAccount, setOpenNewAccount] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    account_type: 'savings',
    initial_deposit: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/accounts');
      // Convert balance to number for each account
      const accountsWithNumberBalance = response.data.map(account => ({
        ...account,
        balance: parseFloat(account.balance) || 0
      }));
      setAccounts(accountsWithNumberBalance);
    } catch (error) {
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/accounts', newAccountData);
      setAccounts([...accounts, response.data.account]);
      setOpenNewAccount(false);
      setNewAccountData({
        account_type: 'savings',
        initial_deposit: '',
      });
    } catch (error) {
      setError('Failed to create account');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAccountData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
            <Typography variant="h4">My Accounts</Typography>
            {user.role === 'customer' && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpenNewAccount(true)}
              >
                Create New Account
              </Button>
            )}
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

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
                    Type: {account.account_type}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    Balance: ${typeof account.balance === 'number' ? account.balance.toFixed(2) : '0.00'}
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
              <MenuItem value="checking">Checking</MenuItem>
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
};

export default Dashboard; 