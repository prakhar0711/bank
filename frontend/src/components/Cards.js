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
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Cards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewCard, setOpenNewCard] = useState(false);
  const [openEditCard, setOpenEditCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newCardData, setNewCardData] = useState({
    accountNumber: '',
    cardType: 'debit',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/cards/customer/${user.userId}`);
      setCards(response.data);
    } catch (error) {
      setError('Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/cards', newCardData);
      setCards([...cards, response.data.card]);
      setOpenNewCard(false);
      setNewCardData({
        accountNumber: '',
        cardType: 'debit',
        expiryDate: '',
        cvv: '',
      });
    } catch (error) {
      setError('Failed to create card');
    }
  };

  const handleUpdateCard = async () => {
    try {
      await axios.put(`http://localhost:5000/api/cards/${selectedCard.CardNumber}`, {
        expiryDate: selectedCard.ExpiryDate,
        cvv: selectedCard.CVV,
      });
      setCards(cards.map(card => 
        card.CardNumber === selectedCard.CardNumber ? selectedCard : card
      ));
      setOpenEditCard(false);
      setSelectedCard(null);
    } catch (error) {
      setError('Failed to update card');
    }
  };

  const handleDeleteCard = async (cardNumber) => {
    try {
      await axios.delete(`http://localhost:5000/api/cards/${cardNumber}`);
      setCards(cards.filter(card => card.CardNumber !== cardNumber));
    } catch (error) {
      setError('Failed to delete card');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCardData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedCard((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCardNumber = (cardNumber) => {
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (date) => {
    return new Date(date).toLocaleDateString();
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
            <Typography variant="h4">My Cards</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenNewCard(true)}
            >
              Request New Card
            </Button>
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {cards.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography>No cards found</Typography>
            </Paper>
          </Grid>
        ) : (
          cards.map((card) => (
            <Grid item xs={12} md={6} key={card.CardNumber}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {card.CardType.charAt(0).toUpperCase() + card.CardType.slice(1)} Card
                  </Typography>
                  <Typography color="textSecondary">
                    Card Number: {formatCardNumber(card.CardNumber)}
                  </Typography>
                  <Typography color="textSecondary">
                    Expiry Date: {formatExpiryDate(card.ExpiryDate)}
                  </Typography>
                  <Typography color="textSecondary">
                    Account: {card.AccountNumber}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedCard(card);
                      setOpenEditCard(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteCard(card.CardNumber)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* New Card Dialog */}
      <Dialog open={openNewCard} onClose={() => setOpenNewCard(false)}>
        <DialogTitle>Request New Card</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Account</InputLabel>
            <Select
              name="accountNumber"
              value={newCardData.accountNumber}
              onChange={handleChange}
            >
              {user.accounts?.map((account) => (
                <MenuItem key={account.AccountNumber} value={account.AccountNumber}>
                  {account.AccountNumber} - {account.AccountType}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Card Type</InputLabel>
            <Select
              name="cardType"
              value={newCardData.cardType}
              onChange={handleChange}
            >
              <MenuItem value="debit">Debit</MenuItem>
              <MenuItem value="credit">Credit</MenuItem>
              <MenuItem value="prepaid">Prepaid</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Expiry Date"
            type="date"
            name="expiryDate"
            value={newCardData.expiryDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="CVV"
            type="password"
            name="cvv"
            value={newCardData.cvv}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewCard(false)}>Cancel</Button>
          <Button onClick={handleCreateCard} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={openEditCard} onClose={() => setOpenEditCard(false)}>
        <DialogTitle>Edit Card</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Expiry Date"
            type="date"
            name="ExpiryDate"
            value={selectedCard?.ExpiryDate || ''}
            onChange={handleEditChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="CVV"
            type="password"
            name="CVV"
            value={selectedCard?.CVV || ''}
            onChange={handleEditChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditCard(false)}>Cancel</Button>
          <Button onClick={handleUpdateCard} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cards; 