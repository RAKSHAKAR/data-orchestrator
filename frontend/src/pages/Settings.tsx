import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, InputAdornment, IconButton, Switch, FormControlLabel } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MicrosoftIcon from '@mui/icons-material/Window';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';

import { settingsApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

export const Settings = () => {
  const [sharepointUrl, setSharepointUrl] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [guidewireUrl, setGuidewireUrl] = useState('');
  const [guidewireApiKey, setGuidewireApiKey] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureTenantId, setAzureTenantId] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuidewireKey, setShowGuidewireKey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [validatingOpenAI, setValidatingOpenAI] = useState(false);
  const [validatingGuidewire, setValidatingGuidewire] = useState(false);
  const [validatingSharepoint, setValidatingSharepoint] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  
  const { user } = useAuthStore();
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.getSettings();
        setSharepointUrl(data.sharepoint_url);
        setOpenaiApiKey(data.openai_api_key || '');
        setGuidewireUrl(data.guidewire_api_url || '');
        setGuidewireApiKey(data.guidewire_api_key || '');
        setAzureClientId(data.azure_client_id || '');
        setAzureTenantId(data.azure_tenant_id || '');
        setSyncEnabled(data.sync_enabled || false);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    setIsAuthenticated(accounts.length > 0);
  }, [accounts]);

  const handleSaveUrl = async () => {
    try {
      await settingsApi.updateSettings(sharepointUrl, openaiApiKey, guidewireUrl, guidewireApiKey, azureClientId, azureTenantId);
      setToast({ open: true, message: 'Settings saved successfully. Please refresh the page to apply Azure changes.', severity: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Failed to save settings', severity: 'error' });
    }
  };

  const handleAuth = async () => {
    try {
      await instance.loginPopup(loginRequest);
      setToast({ open: true, message: 'Successfully authenticated with Microsoft!', severity: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ open: true, message: 'Authentication failed', severity: 'error' });
    }
  };

  const handleSignOut = async () => {
    try {
      await instance.logoutPopup();
      setToast({ open: true, message: 'Successfully signed out from Microsoft!', severity: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ open: true, message: 'Sign out failed', severity: 'error' });
    }
  };

  const handleToggleSync = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setLoading(true);
    try {
      let accessToken = '';
      if (checked) {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        accessToken = response.accessToken;
      }
      await settingsApi.toggleSync(checked, accessToken);
      setSyncEnabled(checked);
      setToast({ open: true, message: checked ? 'Background Sync Enabled!' : 'Background Sync Disabled.', severity: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ open: true, message: 'Failed to update sync settings. Ensure you are signed in.', severity: 'error' });
      setSyncEnabled(!checked); // revert
    } finally {
      setLoading(false);
    }
  };

  const handleTestSharepoint = async () => {
    if (!isAuthenticated) {
      setToast({ open: true, message: 'Please Sign In with Microsoft first', severity: 'error' });
      return;
    }
    setValidatingSharepoint(true);
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0]
      });
      const res = await settingsApi.testSharepoint(sharepointUrl, response.accessToken);
      if (res.status === 'success') {
        setToast({ open: true, message: res.message, severity: 'success' });
      } else {
        setToast({ open: true, message: res.message, severity: 'error' });
      }
    } catch (e) {
      console.error(e);
      setToast({ open: true, message: 'Failed to test SharePoint connection. Check your URL.', severity: 'error' });
    } finally {
      setValidatingSharepoint(false);
    }
  };

  const handleValidateOpenAI = async () => {
    setValidatingOpenAI(true);
    try {
      const response = await settingsApi.validateOpenai(openaiApiKey);
      if (response.status === 'success') {
        setToast({ open: true, message: response.message, severity: 'success' });
      } else {
        setToast({ open: true, message: response.message, severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Failed to validate OpenAI API Key', severity: 'error' });
    } finally {
      setValidatingOpenAI(false);
    }
  };

  const handleValidateGuidewire = async () => {
    setValidatingGuidewire(true);
    try {
      const response = await settingsApi.validateGuidewire(guidewireUrl, guidewireApiKey);
      if (response.status === 'success') {
        setToast({ open: true, message: response.message, severity: 'success' });
      } else {
        setToast({ open: true, message: response.message, severity: 'error' });
      }
    } catch (e) {
      setToast({ open: true, message: 'Failed to validate Guidewire connection', severity: 'error' });
    } finally {
      setValidatingGuidewire(false);
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton component={Link} to="/" sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
          <HomeIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Settings</Typography>
      </Box>
      
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
          <Button variant="outlined" color="primary" onClick={handleTestSharepoint} disabled={!sharepointUrl || !isAuthenticated || validatingSharepoint}>
            {validatingSharepoint ? 'Testing...' : 'Test Connection'}
          </Button>
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
          <Button variant="outlined" color="primary" onClick={handleValidateOpenAI} disabled={!openaiApiKey || validatingOpenAI}>
            {validatingOpenAI ? 'Testing...' : 'Test Connection'}
          </Button>
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
          <Button variant="outlined" color="primary" onClick={handleValidateGuidewire} disabled={!guidewireUrl || !guidewireApiKey || validatingGuidewire}>
            {validatingGuidewire ? 'Testing...' : 'Test Connection'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
          <Button variant="contained" color="primary" onClick={handleSaveUrl}>
            Save All Settings
          </Button>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Microsoft Authentication</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure your Azure Entra ID App credentials. (Save and refresh the page to apply before signing in).
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <TextField
            fullWidth
            label="Azure Client ID"
            variant="outlined"
            size="small"
            value={azureClientId}
            onChange={(e) => setAzureClientId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
          <TextField
            fullWidth
            label="Azure Tenant ID"
            variant="outlined"
            size="small"
            value={azureTenantId}
            onChange={(e) => setAzureTenantId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000 (or 'common')"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {isAuthenticated ? (
            <Alert severity="success" sx={{ flexGrow: 1 }}>Authenticated with Microsoft Entra ID</Alert>
          ) : (
            <Alert severity="info" sx={{ flexGrow: 1 }}>Not Authenticated. Please sign in to connect SharePoint.</Alert>
          )}
          
          {isAuthenticated ? (
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<MicrosoftIcon />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              startIcon={<MicrosoftIcon />}
              onClick={handleAuth}
            >
              Sign In with Microsoft
            </Button>
          )}
        </Box>

      </Paper>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, backgroundColor: '#f8fafc' }}>
         <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Automated SharePoint Sync</Typography>
         <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
           Turn on automated sync to continuously monitor the SharePoint folder and process new files in the background. Requires you to be Signed In.
         </Typography>
         <FormControlLabel
           control={
             <Switch
               checked={syncEnabled}
               onChange={handleToggleSync}
               disabled={loading || !isAuthenticated || !sharepointUrl}
               color="success"
             />
           }
           label={syncEnabled ? "Sync is ON (Background Polling Active)" : "Sync is OFF"}
         />
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
