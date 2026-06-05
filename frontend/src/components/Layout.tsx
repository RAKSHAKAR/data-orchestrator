import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton, useTheme, Avatar, Divider, Badge,
  Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';

import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout, user } = useAuthStore();
  const { toggleDarkMode } = useStore();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* TOP BAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>

          
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 800,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              Data Orchestrator
            </Typography>
          

          <Box sx={{ flexGrow: 1 }} />

          
            <IconButton size="small" onClick={handleNotificationClick} sx={{ color: theme.palette.text.secondary }}>
              <Badge badgeContent={2} color="error" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          
          
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                elevation: 4,
                sx: {
                  mt: 1.5,
                  width: 320,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }
            }}
          >
            <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}>Mark all read</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleNotificationClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <WarningAmberIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Low Confidence Score</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Document 'Invoice_492.pdf' has 72% confidence.</Typography>}
              />
            </MenuItem>
            <MenuItem onClick={handleNotificationClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <DashboardIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Document Pending</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">A document requires manual validation before sending to Guidewire.</Typography>}
              />
            </MenuItem>
            <MenuItem onClick={handleNotificationClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <CheckCircleOutlinedIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>SharePoint Sync</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Successfully synced 3 new files from SharePoint.</Typography>}
              />
            </MenuItem>
            <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>Mark all as read</Typography>
            </Box>
          </Menu>

          
            {user?.role === 'admin' && (
              <IconButton onClick={() => navigate('/settings')} size="small" sx={{ color: theme.palette.text.secondary }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton onClick={toggleDarkMode} size="small" sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />

          
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.name || 'Admin User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                  {user?.email || 'admin@demo.com'}
                </Typography>
              </Box>
            </Box>
          

          
            <IconButton
              onClick={() => { logout(); navigate('/login'); }}
              size="small"
              sx={{ ml: 0.5, color: theme.palette.error.main, opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          
        </Toolbar>
      </AppBar>



      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            pt: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 },
            pb: '5px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
