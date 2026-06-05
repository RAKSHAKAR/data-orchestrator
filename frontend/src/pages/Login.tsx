import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../services/api';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      login(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle at 30% 40%, rgba(37, 99, 235, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 5 },
          width: '100%',
          maxWidth: 420,
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Data Orchestrator
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Sign in to access document processing
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            placeholder="Email Address"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><EmailOutlinedIcon fontSize="small" sx={{ color: '#64748b' }} /></InputAdornment>,
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
                bgcolor: 'rgba(15, 23, 42, 0.4)',
                color: '#f1f5f9',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#60a5fa', borderWidth: '2px' },
                '& input': { paddingLeft: '8px' },
                '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                  transition: 'background-color 5000s ease-in-out 0s',
                  WebkitTextFillColor: '#f1f5f9',
                },
              },
            }}
          />
          <TextField
            fullWidth
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><LockOutlinedIcon fontSize="small" sx={{ color: '#64748b' }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#64748b' }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    
                  </InputAdornment>
                ),
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '50px',
                bgcolor: 'rgba(15, 23, 42, 0.4)',
                color: '#f1f5f9',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#60a5fa', borderWidth: '2px' },
                '& input': { paddingLeft: '8px' },
                '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                  transition: 'background-color 5000s ease-in-out 0s',
                  WebkitTextFillColor: '#f1f5f9',
                },
              },
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: '50px',
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' },
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: '#64748b' }}>
          Admin: admin@demo.com / admin123<br />
          User: user@demo.com / user123
        </Typography>
      </Paper>
    </Box>
  );
};
