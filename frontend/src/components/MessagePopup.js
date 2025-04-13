import React from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const StyledAlert = styled(Alert)(({ theme }) => ({
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '12px 24px',
    '&.MuiAlert-standardSuccess': {
        backgroundColor: '#4caf50',
        color: 'white',
    },
    '&.MuiAlert-standardError': {
        backgroundColor: '#f44336',
        color: 'white',
    },
}));

const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
    '& .MuiSnackbar-root': {
        top: '24px',
    },
}));

function SlideTransition(props) {
    return <Slide {...props} direction="down" />;
}

const MessagePopup = () => {
    const { message, messageType, messageOpen, handleCloseMessage } = useAuth();

    if (!message) return null;

    return (
        <StyledSnackbar
            open={messageOpen}
            autoHideDuration={5000}
            onClose={handleCloseMessage}
            TransitionComponent={SlideTransition}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <StyledAlert
                onClose={handleCloseMessage}
                severity={messageType}
                variant="standard"
            >
                {message}
            </StyledAlert>
        </StyledSnackbar>
    );
};

export default MessagePopup; 