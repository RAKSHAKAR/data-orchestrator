import { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, InputAdornment, IconButton, Switch, FormControlLabel, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MicrosoftIcon from '@mui/icons-material/Window';
import HomeIcon from '@mui/icons-material/Home';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import { Link } from 'react-router-dom';
import { settingsApi } from '../services/api';

import JoditEditor from 'jodit-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color: string;
  bgColor: string;
}

const SettingCard = ({ title, description, icon, isActive, onClick, color, bgColor }: SettingCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        border: `1px solid ${isActive ? color : theme.palette.divider}`,
        bgcolor: isActive ? bgColor : theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 0 1px ${color}22`,
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        width: 40, height: 40, borderRadius: '50%', bgcolor: bgColor, color: color 
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isActive ? color : 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2 }}>
          {description}
        </Typography>
      </Box>
    </Paper>
  );
};

const DEFAULT_PROMPT = `
<ul>
  <li>Search the full document, including paragraphs, narrative text, tables, headers, footers, and envelope pages.</li>
  <li>Do not rely only on exact labels. Values may appear inside sentences.</li>
  <li>Extract the best final value for each field.</li>
  <li>If multiple candidates exist, prefer the one most explicitly tied to the field and most likely to be the final stated value.</li>
  <li>If a value is missing, return: Not found</li>
  <li>Exception: for all monetary/amount fields (amount_billed, 80_percent_amount_billed, amount_paid, amount_owed), if the value is not present in the document, return 0.00 instead of Not found.</li>
  <li>Do not guess.</li>
</ul>
<p>Normalization rules:</p>
<ul>
  <li>Money: return only the numeric value with exactly 2 decimal places, no $ and no commas. If the extracted value has more than 2 decimal places, round it to 2 decimal places (e.g. 123.456 -&gt; 123.46, 50.1 -&gt; 50.10). Always return exactly 2 decimal places, never 1 or 3.</li>
  <li>Dates: return in MM/DD/YYYY when possible; otherwise return the date exactly as written</li>
  <li>Yes/No fields: return Yes, No, or Not found</li>
  <li>Names/addresses: return plain text only. Remove any apostrophe characters (') from names e.g. "O'Brien" -&gt; "OBrien", "D'Angelo" -&gt; "DAngelo".</li>
</ul>
`;

export const Settings = () => {
  const { user } = useAuthStore();
  const { instance, accounts } = useMsal();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState('sharepoint');

  const [sharepointUrl, setSharepointUrl] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [guidewireUrl, setGuidewireUrl] = useState('');
  const [guidewireApiKey, setGuidewireApiKey] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureTenantId, setAzureTenantId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGuidewireKey, setShowGuidewireKey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [validatingOpenAI, setValidatingOpenAI] = useState(false);
  const [validatingSampleOpenAI, setValidatingSampleOpenAI] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [validatingGuidewire, setValidatingGuidewire] = useState(false);
  const [validatingSharepoint, setValidatingSharepoint] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [sharepointFiles, setSharepointFiles] = useState<any[]>([]);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  
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
        if (data.system_prompt) {
          setSystemPrompt(data.system_prompt);
        } else {
          setSystemPrompt(DEFAULT_PROMPT);
        }
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
    setSavingSettings(true);
    try {
      await settingsApi.updateSettings(sharepointUrl, openaiApiKey, guidewireUrl, guidewireApiKey, azureClientId, azureTenantId, systemPrompt);
      setToast({ open: true, message: 'Settings saved successfully. Please refresh the page to apply changes.', severity: 'success' });
    } catch (e) {
      setToast({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSavingSettings(false);
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
        if (res.files) {
          setSharepointFiles(res.files);
        }
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

  const handleValidateOpenAI = async (useSample: boolean = false) => {
    if (!useSample && !testFile) {
      setToast({ open: true, message: 'Please upload a file or use the sample file for testing.', severity: 'error' });
      return;
    }
    
    if (useSample) {
      setValidatingSampleOpenAI(true);
    } else {
      setValidatingOpenAI(true);
    }
    setExtractionResult(null);
    
    try {
      const response = await settingsApi.testOpenaiExtraction(openaiApiKey, systemPrompt, useSample ? null : testFile, useSample);
      if (response.status === 'success') {
        setToast({ open: true, message: response.message, severity: 'success' });
        setExtractionResult(response.data);
      } else {
        setToast({ open: true, message: response.message, severity: 'error' });
      }
    } catch (e: any) {
      setToast({ open: true, message: e?.response?.data?.message || 'Failed to validate and test extraction', severity: 'error' });
    } finally {
      setValidatingOpenAI(false);
      setValidatingSampleOpenAI(false);
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
        <IconButton component={Link} to="/" sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
          <HomeIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Settings</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        
        {/* LEFT COLUMN: CARDS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: { xs: '100%', md: '320px' }, flexShrink: 0 }}>
          <SettingCard 
            title="SharePoint Integration" 
            description="Configure automated sync & folders"
            icon={<CloudUploadIcon />} 
            color="#2563eb" bgColor="#eff6ff" 
            isActive={activeTab === 'sharepoint'} 
            onClick={() => setActiveTab('sharepoint')} 
          />
          <SettingCard 
            title="AI Vision Extraction" 
            description="OpenAI API keys & custom prompts"
            icon={<DocumentScannerIcon />} 
            color="#8b5cf6" bgColor="#ede9fe" 
            isActive={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')} 
          />
          <SettingCard 
            title="Guidewire Integration" 
            description="API endpoints and authentication"
            icon={<CheckCircleOutlineIcon />} 
            color="#059669" bgColor="#ecfdf5" 
            isActive={activeTab === 'guidewire'} 
            onClick={() => setActiveTab('guidewire')} 
          />
          <SettingCard 
            title="Microsoft Authentication" 
            description="Azure Entra ID App credentials"
            icon={<MicrosoftIcon />} 
            color="#0ea5e9" bgColor="#e0f2fe" 
            isActive={activeTab === 'azure'} 
            onClick={() => setActiveTab('azure')} 
          />
          <SettingCard 
            title="Background Sync" 
            description="Automated folder polling"
            icon={<SyncIcon />} 
            color="#d97706" bgColor="#fffbeb" 
            isActive={activeTab === 'sync'} 
            onClick={() => setActiveTab('sync')} 
          />
          
        </Box>

        {/* RIGHT COLUMN: SETTING DETAILS */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={0} sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2, minHeight: 'auto' }}>
            
            {activeTab === 'sharepoint' && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>SharePoint Integration</Typography>
                
                {!isAuthenticated ? (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 4 }}
                    action={
                      <Button color="inherit" size="small" onClick={() => setActiveTab('azure')}>
                        Go to Microsoft Authentication
                      </Button>
                    }
                  >
                    You must login to Microsoft Authentication first to connect with SharePoint and configure the folder URL.
                  </Alert>
                ) : (
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                    Configure the SharePoint folder URL where files will be uploaded. The system will automatically trigger the processing workflow whenever a new file is uploaded to this folder.
                  </Typography>
                )}

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>SharePoint Folder URL</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <TextField
                    fullWidth
                    name="sharepoint_url_field"
                    autoComplete="off"
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
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={handleTestSharepoint} 
                    disabled={!sharepointUrl || !isAuthenticated || validatingSharepoint}
                    startIcon={validatingSharepoint ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {validatingSharepoint ? 'Testing Connection...' : 'Test Connection'}
                  </Button>
                </Box>

                {sharepointFiles.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Folder Library Contents</Typography>
                    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      {sharepointFiles.map((file, idx) => (
                        <Box 
                          key={idx} 
                          sx={{ 
                            display: 'flex', alignItems: 'center', p: 1.5, gap: 2,
                            borderBottom: idx < sharepointFiles.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' },
                            cursor: 'pointer'
                          }}
                        >
                          {file.type === 'folder' ? <FolderIcon sx={{ color: '#fbbf24' }} /> : <InsertDriveFileIcon sx={{ color: '#94a3b8' }} />}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{file.name}</Typography>
                            {file.type === 'file' && <Typography variant="caption" color="textSecondary">{file.size}</Typography>}
                          </Box>
                          <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>{file.modified}</Typography>
                          <IconButton 
                            size="small" 
                            title="Download"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (file.downloadUrl) {
                                window.open(file.downloadUrl, '_blank');
                              } else {
                                setToast({ open: true, message: `Downloading ${file.name}... (Simulated)`, severity: 'success' });
                              }
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </Box>
                )}
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', pt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleSaveUrl}
                    disabled={!sharepointUrl || savingSettings}
                    startIcon={savingSettings && activeTab === 'sharepoint' ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {savingSettings && activeTab === 'sharepoint' ? 'Saving...' : 'Save SharePoint Settings'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 'ai' && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>AI Vision Extraction</Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                  Configure the artificial intelligence parameters used to extract complex structured data from insurance documents.
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>OpenAI API Key</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <TextField
                    fullWidth
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

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Test Document</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Upload a document to test the extraction, or download the default sample file.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
                  <Button variant="outlined" component="label">
                    Upload Test File
                    <input type="file" hidden accept="application/pdf" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setTestFile(e.target.files[0]);
                      }
                    }} />
                  </Button>
                  {testFile && <Typography variant="body2" sx={{ fontWeight: 500, color: 'success.main' }}>Selected: {testFile.name}</Typography>}
                  <Button variant="text" size="small" onClick={() => window.open(settingsApi.downloadSampleUrl, '_blank')}>
                    Download Sample PDF
                  </Button>
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>System Extraction Prompt</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Customize the direct instructions given to the AI. This text acts as the "Brain" of the extraction logic.
                </Typography>
                <Box sx={{ mb: 4 }}>
                  <JoditEditor
                    value={systemPrompt}
                    config={{
                      readonly: false,
                      height: 300,
                      theme: 'default',
                    }}
                    onBlur={(newContent) => setSystemPrompt(newContent)}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4, gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => handleValidateOpenAI(false)} 
                    disabled={!openaiApiKey || !systemPrompt || !testFile || validatingOpenAI || validatingSampleOpenAI}
                    startIcon={validatingOpenAI ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {validatingOpenAI ? 'Running Extraction Test...' : 'Test Connection & Extraction'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => handleValidateOpenAI(true)} 
                    disabled={!openaiApiKey || !systemPrompt || validatingOpenAI || validatingSampleOpenAI}
                    startIcon={validatingSampleOpenAI ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {validatingSampleOpenAI ? 'Running Sample Test...' : 'Test with Sample File'}
                  </Button>
                </Box>

                <Dialog 
                  open={!!extractionResult} 
                  onClose={() => setExtractionResult(null)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogTitle sx={{ fontWeight: 600 }}>Extraction Result</DialogTitle>
                  <DialogContent dividers>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e293b', color: '#e2e8f0', borderRadius: 2, overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        {JSON.stringify(extractionResult, null, 2)}
                      </pre>
                    </Paper>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setExtractionResult(null)} color="primary">
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', pt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleSaveUrl}
                    disabled={!openaiApiKey || !systemPrompt || savingSettings}
                    startIcon={savingSettings && activeTab === 'ai' ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {savingSettings && activeTab === 'ai' ? 'Saving...' : 'Save AI Vision Settings'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 'guidewire' && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Guidewire Integration</Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                  Configure the Guidewire ClaimCenter API endpoint for sending manually validated insurance claims and extracting structured values downstream.
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Guidewire API URL</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <TextField
                    fullWidth
                    name="guidewire_url_field"
                    autoComplete="off"
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

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Guidewire API Key</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                  <TextField
                    fullWidth
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
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={handleValidateGuidewire} 
                    disabled={!guidewireUrl || !guidewireApiKey || validatingGuidewire}
                    startIcon={validatingGuidewire ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {validatingGuidewire ? 'Running Validation...' : 'Test Connection'}
                  </Button>
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', pt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleSaveUrl}
                    disabled={!guidewireUrl || !guidewireApiKey || savingSettings}
                    startIcon={savingSettings && activeTab === 'guidewire' ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {savingSettings && activeTab === 'guidewire' ? 'Saving...' : 'Save Guidewire Settings'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 'azure' && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Microsoft Authentication</Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                  Configure your Azure Entra ID App credentials. This enables single sign-on and Microsoft Graph API access for SharePoint sync.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Azure Client ID</Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Azure Tenant ID</Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="small"
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000 (or 'common')"
                    />
                  </Box>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Authentication Status</Typography>
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
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MicrosoftIcon />}
                        onClick={handleSignOut}
                        sx={{ height: 48 }}
                        disabled={loading}
                      >
                        {loading ? 'Signing Out...' : 'Sign Out'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outlined" 
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MicrosoftIcon />}
                        onClick={handleAuth}
                        sx={{ height: 48 }}
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In with Microsoft'}
                      </Button>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', pt: 3 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    onClick={handleSaveUrl}
                    disabled={!azureClientId || !azureTenantId || savingSettings}
                    startIcon={savingSettings && activeTab === 'azure' ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {savingSettings && activeTab === 'azure' ? 'Saving...' : 'Save Azure Settings'}
                  </Button>
                </Box>
              </Box>
            )}

            {activeTab === 'sync' && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Background Sync</Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                  Turn on automated sync to continuously monitor the connected SharePoint folder and process new files in the background via automated worker tasks.
                </Typography>
                
                <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>SharePoint Polling Service</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {syncEnabled ? "Sync is currently ON and checking for new files." : "Sync is currently OFF."}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={syncEnabled}
                        onChange={handleToggleSync}
                        disabled={loading || !isAuthenticated || !sharepointUrl}
                        color="success"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
                
                {!isAuthenticated && (
                   <Alert severity="warning" sx={{ mt: 3 }}>
                     You must be signed in with Microsoft before you can enable background sync.
                   </Alert>
                )}
                {!sharepointUrl && (
                   <Alert severity="warning" sx={{ mt: 3 }}>
                     Please configure a SharePoint URL first.
                   </Alert>
                )}
              </Box>
            )}

          </Paper>
        </Box>
      </Box>

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
