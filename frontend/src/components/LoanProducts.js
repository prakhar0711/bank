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
  Fade,
  Grow,
  Zoom,
  LinearProgress,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Percent as PercentIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
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

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: '2px',
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: '12px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[300],
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: '2px',
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
    <StyledContainer>
      <ContentContainer>
        <Fade in={true} timeout={500}>
          <StyledPaper>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" sx={{ fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Loan Products
              </Typography>
              {userRole === 'employee' && (
                <StyledButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Create New Product
                </StyledButton>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <StyledTable>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount Range</TableCell>
                    <TableCell>Duration Range</TableCell>
                    <TableCell>Interest Rate</TableCell>
                    <TableCell>Status</TableCell>
                    {userRole === 'employee' && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanProducts.map((product, index) => (
                    <Grow in={true} timeout={500} key={product.id} style={{ transitionDelay: `${index * 100}ms` }}>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {product.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.loan_type}
                            color="primary"
                            variant="outlined"
                            sx={{ borderRadius: '8px' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography>
                              ${product.min_amount} - ${product.max_amount}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography>
                              {product.min_duration} - {product.max_duration} months
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PercentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography>
                              {product.interest_rate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={product.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                            label={product.is_active ? 'Active' : 'Inactive'}
                            color={product.is_active ? 'success' : 'error'}
                            sx={{ borderRadius: '8px' }}
                          />
                        </TableCell>
                        {userRole === 'employee' && (
                          <TableCell>
                            <IconButton
                              onClick={() => handleOpenDialog(product)}
                              sx={{
                                color: 'primary.main',
                                '&:hover': {
                                  background: 'rgba(102, 126, 234, 0.1)',
                                },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    </Grow>
                  ))}
                </TableBody>
              </Table>
            </StyledTable>
          </StyledPaper>
        </Fade>

        <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {selectedProduct ? 'Edit Loan Product' : 'Create New Loan Product'}
              </Typography>
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
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
                    <StyledSelect
                      name="loan_type"
                      value={formData.loan_type}
                      onChange={handleInputChange}
                      label="Loan Type"
                    >
                      <MenuItem value="personal">Personal</MenuItem>
                      <MenuItem value="home">Home</MenuItem>
                      <MenuItem value="car">Car</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                    </StyledSelect>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PercentIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MoneyIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    fullWidth
                    label="Minimum Duration (months)"
                    name="min_duration"
                    type="number"
                    value={formData.min_duration}
                    onChange={handleInputChange}
                    error={!!formErrors.min_duration}
                    helperText={formErrors.min_duration}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StyledTextField
                    fullWidth
                    label="Maximum Duration (months)"
                    name="max_duration"
                    type="number"
                    value={formData.max_duration}
                    onChange={handleInputChange}
                    error={!!formErrors.max_duration}
                    helperText={formErrors.max_duration}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
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
            <StyledButton onClick={handleCloseDialog}>Cancel</StyledButton>
            <StyledButton onClick={handleSubmit} variant="contained" color="primary">
              {selectedProduct ? 'Update' : 'Create'}
            </StyledButton>
          </DialogActions>
        </StyledDialog>
      </ContentContainer>
    </StyledContainer>
  );
};

export default LoanProducts; 