import { Box, Typography, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

export const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        textAlign: 'center',
        px: 3
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
        404
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
        The page you are looking for doesn't exist or has been moved. Please check the URL or navigate back to the dashboard.
      </Typography>
      <Button 
        variant="contained" 
        size="large" 
        onClick={() => navigate('/')}
        sx={{ borderRadius: 2, px: 4 }}
      >
        Go to Home
      </Button>
    </Box>
  );
};
