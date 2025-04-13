import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccountBalance as AccountBalanceIcon,
  AccountCircle as AccountCircleIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  position: 'sticky',
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2, 3),
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  color: 'white',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.common.white,
  fontWeight: 600,
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => navigate('/')}
          >
            <AccountBalanceIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        <LogoContainer>
          <Logo
            variant="h6"
            component="a"
            href="/"
            sx={{ textDecoration: 'none' }}
          >
            BMS
          </Logo>
        </LogoContainer>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user ? (
            <>
              
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleMenu}
                sx={{ ml: 1 }}
              >
                {user.avatar ? (
                  <Avatar
                    alt={user.name}
                    src={user.avatar}
                    sx={{ width: 40, height: 40 }}
                  />
                ) : (
                  <AccountCircleIcon sx={{ fontSize: 40 }} />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    background: 'rgba(45, 45, 45, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      color: theme.palette.common.white,
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  },
                }}
              >
                
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <StyledButton onClick={() => navigate('/login')}>
                Login
              </StyledButton>
              <StyledButton
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
              >
                Register
              </StyledButton>
            </>
          )}
        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar; 