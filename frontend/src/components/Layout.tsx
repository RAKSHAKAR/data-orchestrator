import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, useTheme, Avatar, Divider, Tooltip, Badge
} from '@mui/material';
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

  const currentDrawerWidth = drawerOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
    { text: 'Upload', icon: <UploadFileIcon />, path: '/upload' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

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
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)} edge="start" size="small" sx={{ mr: 1 }}>
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

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

          <Tooltip title="Notifications">
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <Badge badgeContent={2} color="error" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <IconButton onClick={toggleDarkMode} size="small" sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>

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
                {user?.email || 'admin@dataorchestrator.com'}
              </Typography>
            </Box>
          </Box>

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
                  <Tooltip title={drawerOpen ? '' : item.text} placement="right">
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
