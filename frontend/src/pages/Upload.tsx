import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, useTheme, Tooltip } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useNavigate } from 'react-router-dom';
import { documentApi, settingsApi } from '../services/api';

export const Upload = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sharepointReady, setSharepointReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    settingsApi.getSettings().then(data => {
      if (data.is_authenticated && data.sharepoint_url) {
        setSharepointReady(true);
      }
    }).catch(err => console.error("Failed to fetch settings", err));
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await documentApi.uploadDocument(file);
      setSuccess(true);
      setTimeout(() => {
        navigate('/'); // Redirect to dashboard after 1.5s
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSharepointUpload = async () => {
    setUploading(true);
    try {
      const res = await settingsApi.simulateSharepointUpload();
      if (res.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert('SharePoint upload failed. Please configure Settings.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', mx: 'auto', mt: 4, width: '100%' }}>
      <Box>
        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 700 }}>Upload Document</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Upload standard or scanned PDFs for automated Data Orchestrator processing.
        </Typography>
      </Box>

      <Tooltip title={file ? '' : 'Drag and drop your PDF here, or click to browse'} placement="top">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
            bgcolor: dragActive ? (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.05)' : '#eff6ff') : (theme.palette.mode === 'dark' ? '#0f172a' : '#fafbfc'),
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          
          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
              <Typography variant="h6">Upload Successful!</Typography>
              <Typography variant="body2" color="text.secondary">Redirecting to Dashboard...</Typography>
            </Box>
          ) : file ? (
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6">{file.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Tooltip title="Remove selected file">
                  <span>
                    <Button variant="outlined" onClick={() => setFile(null)} disabled={uploading}>
                      Cancel
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Upload and begin AI extraction">
                  <span>
                    <Button variant="contained" onClick={handleUpload} disabled={uploading} startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadOutlinedIcon />}>
                      {uploading ? 'Processing...' : 'Confirm Upload'}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Drag & Drop your PDF here</Typography>
              <Typography variant="body2" color="text.secondary">or click to browse your files</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => inputRef.current?.click()}
                  sx={{ px: 4, borderRadius: 2 }}
                >
                  Browse Files
                </Button>
                <Tooltip title={!sharepointReady ? "Requires Microsoft authentication and SharePoint URL in Settings" : "Simulate automated SharePoint sync"}>
                  <span>
                    <Button
                      variant="outlined"
                      onClick={handleSharepointUpload}
                      disabled={uploading || !sharepointReady}
                      sx={{ px: 4, borderRadius: 2 }}
                    >
                      {uploading ? 'Syncing...' : 'Upload from SharePoint'}
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </>
          )}
        </Paper>
      </Tooltip>
    </Box>
  );
};
