import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const LoanProducts = () => {
  const { user } = useAuth();
  const [loanProducts, setLoanProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    loan_type: 'personal',
    min_amount: '',
    max_amount: '',
    min_duration: '',
    max_duration: '',
    interest_rate: '',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    fetchLoanProducts();
  }, []);

  const fetchLoanProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/loan_products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoanProducts(response.data);
    } catch (error) {
      setError('Failed to fetch loan products');
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        loan_type: product.loan_type,
        min_amount: product.min_amount,
        max_amount: product.max_amount,
        min_duration: product.min_duration,
        max_duration: product.max_duration,
        interest_rate: product.interest_rate,
        is_active: product.is_active,
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        loan_type: 'personal',
        min_amount: '',
        max_amount: '',
        min_duration: '',
        max_duration: '',
        interest_rate: '',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'is_active' ? checked : value,
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.min_amount) errors.min_amount = 'Minimum amount is required';
    if (!formData.max_amount) errors.max_amount = 'Maximum amount is required';
    if (!formData.min_duration) errors.min_duration = 'Minimum duration is required';
    if (!formData.max_duration) errors.max_duration = 'Maximum duration is required';
    if (!formData.interest_rate) errors.interest_rate = 'Interest rate is required';
    
    // Validate numeric fields
    if (formData.min_amount && isNaN(formData.min_amount)) errors.min_amount = 'Must be a number';
    if (formData.max_amount && isNaN(formData.max_amount)) errors.max_amount = 'Must be a number';
    if (formData.min_duration && isNaN(formData.min_duration)) errors.min_duration = 'Must be a number';
    if (formData.max_duration && isNaN(formData.max_duration)) errors.max_duration = 'Must be a number';
    if (formData.interest_rate && isNaN(formData.interest_rate)) errors.interest_rate = 'Must be a number';
    
    // Validate min/max relationships
    if (formData.min_amount && formData.max_amount && parseFloat(formData.min_amount) > parseFloat(formData.max_amount)) {
      errors.max_amount = 'Must be greater than minimum amount';
    }
    if (formData.min_duration && formData.max_duration && parseInt(formData.min_duration) > parseInt(formData.max_duration)) {
      errors.max_duration = 'Must be greater than minimum duration';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (selectedProduct) {
        // Update existing product
        await axios.put(
          `http://localhost:5000/api/loan_products/${selectedProduct.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new product
        await axios.post(
          'http://localhost:5000/api/loan_products',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      fetchLoanProducts();
      handleCloseDialog();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.path] = err.msg;
        });
        setFormErrors(apiErrors);
      } else {
        setError(selectedProduct ? 'Failed to update loan product' : 'Failed to create loan product');
      }
      console.error('API Error:', error);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/loan_products/${product.id}`,
        { is_active: !product.is_active },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchLoanProducts();
    } catch (error) {
      setError('Failed to update loan product status');
      console.error('API Error:', error);
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
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Loan Products</Typography>
          {userRole === 'employee' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              Create New Loan Product
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Min Amount</TableCell>
                <TableCell>Max Amount</TableCell>
                <TableCell>Min Duration</TableCell>
                <TableCell>Max Duration</TableCell>
                <TableCell>Interest Rate</TableCell>
                <TableCell>Status</TableCell>
                {userRole === 'employee' && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loanProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.loan_type}</TableCell>
                  <TableCell>${product.min_amount}</TableCell>
                  <TableCell>${product.max_amount}</TableCell>
                  <TableCell>{product.min_duration} months</TableCell>
                  <TableCell>{product.max_duration} months</TableCell>
                  <TableCell>{product.interest_rate}%</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={product.is_active}
                          onChange={() => handleToggleActive(product)}
                          disabled={userRole !== 'employee'}
                        />
                      }
                      label={product.is_active ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  {userRole === 'employee' && (
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleOpenDialog(product)}
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Loan Product' : 'Create New Loan Product'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Loan Type</InputLabel>
                  <Select
                    name="loan_type"
                    value={formData.loan_type}
                    onChange={handleInputChange}
                    label="Loan Type"
                  >
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="business">Business</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Interest Rate (%)"
                  name="interest_rate"
                  type="number"
                  value={formData.interest_rate}
                  onChange={handleInputChange}
                  error={!!formErrors.interest_rate}
                  helperText={formErrors.interest_rate}
                  required
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Amount"
                  name="min_amount"
                  type="number"
                  value={formData.min_amount}
                  onChange={handleInputChange}
                  error={!!formErrors.min_amount}
                  helperText={formErrors.min_amount}
                  required
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Amount"
                  name="max_amount"
                  type="number"
                  value={formData.max_amount}
                  onChange={handleInputChange}
                  error={!!formErrors.max_amount}
                  helperText={formErrors.max_amount}
                  required
                  inputProps={{ step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Duration (months)"
                  name="min_duration"
                  type="number"
                  value={formData.min_duration}
                  onChange={handleInputChange}
                  error={!!formErrors.min_duration}
                  helperText={formErrors.min_duration}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Maximum Duration (months)"
                  name="max_duration"
                  type="number"
                  value={formData.max_duration}
                  onChange={handleInputChange}
                  error={!!formErrors.max_duration}
                  helperText={formErrors.max_duration}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      name="is_active"
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LoanProducts; 