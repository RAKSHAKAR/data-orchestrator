import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MicrosoftIcon from '@mui/icons-material/Window';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { settingsApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const Settings = () => {
  const [sharepointUrl, setSharepointUrl] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [guidewireUrl, setGuidewireUrl] = useState('');
  const [guidewireApiKey, setGuidewireApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuidewireKey, setShowGuidewireKey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        setSharepointUrl(data.sharepoint_url);
        setOpenaiApiKey(data.openai_api_key || '');
        setGuidewireUrl(data.guidewire_api_url || '');
        setGuidewireApiKey(data.guidewire_api_key || '');
        setIsAuthenticated(data.is_authenticated);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveUrl = async () => {
    try {
      await settingsApi.updateSettings(sharepointUrl, openaiApiKey, guidewireUrl, guidewireApiKey);
      setToast({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Failed to save settings', severity: 'error' });
    }
  };

  const handleAuth = async () => {
    try {
      await settingsApi.authenticateMicrosoft();
      setIsAuthenticated(true);
      setToast({ open: true, message: 'Successfully authenticated with Microsoft!', severity: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Authentication failed', severity: 'error' });
    }
  };

  const handleSimulateUpload = async () => {
    if (!isAuthenticated || !sharepointUrl) {
      setToast({ open: true, message: 'Please authenticate and configure a URL first', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      const response = await settingsApi.simulateSharepointUpload();
      if (response.status === 'success') {
        setToast({ open: true, message: 'SharePoint sync simulated successfully! Processing triggered.', severity: 'success' });
      } else {
        setToast({ open: true, message: response.message, severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Failed to sync with SharePoint', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error" gutterBottom>Unauthorized Access</Typography>
        <Typography variant="body1">You do not have administrative privileges to view or modify settings.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, margin: '0 auto', width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Settings</Typography>
      
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>SharePoint Integration</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure the SharePoint folder URL where files will be uploaded. The system will automatically trigger the processing workflow whenever a new file is uploaded to this folder.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            name="sharepoint_url_field"
            autoComplete="off"
            label="SharePoint Folder URL"
            variant="outlined"
            size="small"
            value={sharepointUrl}
            onChange={(e) => setSharepointUrl(e.target.value)}
            placeholder="https://yourtenant.sharepoint.com/sites/Documents"
            slotProps={{
              htmlInput: {
                autoComplete: 'off',
                name: 'random-sharepoint-name'
              }
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>AI Vision Extraction</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure the OpenAI API Key used for extracting data from PDFs via the Vision API.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="OpenAI API Key"
            variant="outlined"
            size="small"
            type={showApiKey ? 'text' : 'password'}
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            slotProps={{
              htmlInput: {
                autoComplete: 'new-password',
                name: 'random-openai-name'
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle api key visibility"
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Guidewire Integration</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure the Guidewire API endpoint for sending validated insurance claims.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            name="guidewire_url_field"
            autoComplete="off"
            label="Guidewire API URL"
            variant="outlined"
            size="small"
            value={guidewireUrl}
            onChange={(e) => setGuidewireUrl(e.target.value)}
            placeholder="https://gw-api.yourcompany.com/cc/rest/claims"
            slotProps={{
              htmlInput: {
                autoComplete: 'off',
                name: 'random-gw-url'
              }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="Guidewire API Key"
            variant="outlined"
            size="small"
            type={showGuidewireKey ? 'text' : 'password'}
            value={guidewireApiKey}
            onChange={(e) => setGuidewireApiKey(e.target.value)}
            placeholder="Enter API Key"
            slotProps={{
              htmlInput: {
                autoComplete: 'new-password',
                name: 'random-gw-key'
              },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle guidewire key visibility"
                      onClick={() => setShowGuidewireKey(!showGuidewireKey)}
                      edge="end"
                    >
                      {showGuidewireKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
          <Button variant="contained" color="primary" onClick={handleSaveUrl}>
            Save All Settings
          </Button>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Microsoft Authentication</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {isAuthenticated ? (
            <Alert severity="success" sx={{ flexGrow: 1 }}>Authenticated with Microsoft Entra ID</Alert>
          ) : (
            <Alert severity="info" sx={{ flexGrow: 1 }}>Not Authenticated. Please sign in to connect SharePoint.</Alert>
          )}
          
          <Button 
            variant="outlined" 
            startIcon={<MicrosoftIcon />}
            onClick={handleAuth}
            disabled={isAuthenticated}
          >
            {isAuthenticated ? 'Signed In' : 'Sign In with Microsoft'}
          </Button>
        </Box>

      </Paper>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, backgroundColor: '#f8fafc' }}>
         <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Simulate Automated Trigger</Typography>
         <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
           For the purpose of this demo, you can click the button below to manually simulate the automated webhook trigger that would occur when a new file drops into the configured SharePoint folder.
         </Typography>
         <Button 
            variant="contained" 
            color="success" 
            startIcon={<CloudSyncIcon />}
            onClick={handleSimulateUpload}
            disabled={loading || !isAuthenticated || !sharepointUrl}
          >
            Simulate Auto-Sync from SharePoint
          </Button>
      </Paper>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
