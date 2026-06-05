import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, useTheme, Avatar, Divider, Tooltip, Badge,
  Menu, MenuItem, ListItemAvatar
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 72;

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { logout, user } = useAuthStore();
  const { toggleDarkMode } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const currentDrawerWidth = drawerOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
    { text: 'Upload', icon: <UploadFileIcon />, path: '/upload' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ text: 'Settings', icon: <SettingsIcon />, path: '/settings' });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
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
          <Tooltip title={drawerOpen ? "Collapse sidebar" : "Expand sidebar"}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" size="small" sx={{ mr: 1 }}>
              {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Go to Dashboard">
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
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="View pending notifications">
            <IconButton size="small" onClick={handleNotificationClick} sx={{ color: theme.palette.text.secondary }}>
              <Badge badgeContent={2} color="error" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
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
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
            </Box>
            <MenuItem onClick={handleNotificationClose} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <ListItemIcon>
                <WarningAmberIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" fontWeight="600">Document Pending</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">A document requires manual validation before sending to Guidewire.</Typography>}
              />
            </MenuItem>
            <MenuItem onClick={handleNotificationClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <CheckCircleOutlinedIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography variant="body2" fontWeight="600">SharePoint Sync</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Successfully synced 3 new files from SharePoint.</Typography>}
              />
            </MenuItem>
            <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>Mark all as read</Typography>
            </Box>
          </Menu>

          <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={toggleDarkMode} size="small" sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />

          <Tooltip title="Current user profile">
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
          </Tooltip>

          <Tooltip title="Sign Out">
            <IconButton
              onClick={() => { logout(); navigate('/login'); }}
              size="small"
              sx={{ ml: 0.5, color: theme.palette.error.main, opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          transition: 'width 0.2s ease',
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            transition: 'width 0.2s ease',
            overflowX: 'hidden',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ mt: 2, px: drawerOpen ? 1.5 : 0.75 }}>
          {drawerOpen && (
            <Typography
              variant="overline"
              sx={{ px: 1.5, mb: 1, display: 'block', color: theme.palette.text.secondary, fontSize: '0.65rem' }}
            >
              Navigation
            </Typography>
          )}
          <List disablePadding>
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItemButton
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1,
                    px: drawerOpen ? 1.5 : 'auto',
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    minHeight: 44,
                    '&.Mui-selected': {
                      bgcolor: `${theme.palette.primary.main}14`,
                      color: theme.palette.primary.main,
                      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                      '&:hover': { bgcolor: `${theme.palette.primary.main}20` },
                    },
                    '&:hover': { bgcolor: theme.palette.action.hover },
                  }}
                >
                  <Tooltip title={drawerOpen ? '' : `Go to ${item.text}`} placement="right">
                    <ListItemIcon
                      sx={{
                        minWidth: drawerOpen ? 36 : 'auto',
                        mr: drawerOpen ? 1 : 0,
                        justifyContent: 'center',
                        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </Tooltip>
                  {drawerOpen && (
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}>
                          {item.text}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${currentDrawerWidth}px)`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
        }}
      >
        <Toolbar />
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
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
