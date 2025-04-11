import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Snackbar } from '@mui/material';

const MessagePopup = () => {
    const { message, messageType } = useAuth();

    if (!message) return null;

    return (
        <Snackbar
            open={!!message}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                severity={messageType === 'success' ? 'success' : 'error'}
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default MessagePopup; 