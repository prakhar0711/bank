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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(selectedProduct ? 'Failed to update loan product' : 'Failed to create loan product');
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Create New Loan Product
          </Button>
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
                <TableCell>Type</TableCell>
                <TableCell>Amount Range</TableCell>
                <TableCell>Duration Range</TableCell>
                <TableCell>Interest Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loanProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {product.loan_type.charAt(0).toUpperCase() + product.loan_type.slice(1)}
                  </TableCell>
                  <TableCell>
                    ${product.min_amount.toLocaleString()} - ${product.max_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {product.min_duration} - {product.max_duration} months
                  </TableCell>
                  <TableCell>{product.interest_rate}%</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(product.is_active)}
                          onChange={() => handleToggleActive(product)}
                          color="primary"
                        />
                      }
                      label={product.is_active ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(product)}
                    >
                      Edit
                    </Button>
                  </TableCell>
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
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                    required
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
                      color="primary"
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