import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, TextField, InputAdornment,
  Tooltip, TablePagination, LinearProgress, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SyncIcon from '@mui/icons-material/Sync';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/api';

/* ───────── Status Chip ───────── */
const StatusChip = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    COMPLETED: { label: 'Completed', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    VALIDATED: { label: 'Validated', color: '#2563eb', bg: '#eff6ff', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    PENDING_VALIDATION: { label: 'Pending', color: '#d97706', bg: '#fffbeb', icon: <PendingOutlinedIcon sx={{ fontSize: 14 }} /> },
    DATA_EXTRACTED: { label: 'Extracted', color: '#7c3aed', bg: '#f5f3ff', icon: <DescriptionOutlinedIcon sx={{ fontSize: 14 }} /> },
    LOW_CONFIDENCE: { label: 'Low Confidence', color: '#dc2626', bg: '#fef2f2', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
    FAILED: { label: 'Failed', color: '#dc2626', bg: '#fef2f2', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
    PROCESSING: { label: 'Processing', color: '#0284c7', bg: '#f0f9ff', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
  };
  const c = map[status] || map['PROCESSING'];
  return (
    <Chip
      icon={c.icon as React.ReactElement}
      label={c.label}
      size="small"
      sx={{ color: c.color, bgcolor: c.bg, border: `1px solid ${c.color}30`, fontWeight: 600, fontSize: '0.75rem', height: 26, '& .MuiChip-icon': { color: c.color } }}
    />
  );
};



/* ───────── Component ───────── */
export const DocumentList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentApi.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await documentApi.uploadDocument(selectedFile);
      setUploadOpen(false);
      setSelectedFile(null);
      fetchDocuments(); // Refresh list after upload
    } catch (error) {
      console.error('Failed to upload document', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.file_name.toLowerCase().includes(term) ||
      (doc.extracted_data?.claim_number || '').includes(term) ||
      (doc.extracted_data?.claimant_name || '').toLowerCase().includes(term) ||
      (doc.extracted_data?.firm_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary' }}>Documents</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and review all uploaded PDF documents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload PDF
        </Button>
      </Box>

      {/* Table Card */}
      <Paper elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by File Name, Claim #, Claimant, or Firm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300, flex: '0 1 450px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
              },
            }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {filteredDocs.length} of {documents.length} documents
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchDocuments} disabled={loading}>
              <SyncIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Table */}
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {['File Name', 'Claim #', 'Claimant', 'Firm Name', 'Processing Date', 'Amount', 'Confidence', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' }} align={h === 'Actions' ? 'center' : 'left'}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                    <Typography color="text.secondary">No documents found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((doc) => (
                  <TableRow key={doc.id} hover sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }} onClick={() => navigate(`/documents/${doc.id}`)}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.5 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.file_name}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{doc.extracted_data?.claim_number || 'N/A'}</Typography></TableCell>
                    <TableCell>{doc.extracted_data?.claimant_name || 'N/A'}</TableCell>
                    <TableCell>{doc.extracted_data?.firm_name || 'N/A'}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{doc.extracted_data?.processing_date || new Date(doc.created_at).toLocaleString()}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.extracted_data?.amount_billed || 'N/A'}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.round((doc.confidence_score || 0) * 100)} sx={{ width: 50, height: 4, borderRadius: 2, bgcolor: (doc.confidence_score || 0) >= 0.8 ? '#05966915' : '#dc262615', '& .MuiLinearProgress-bar': { bgcolor: (doc.confidence_score || 0) >= 0.8 ? '#059669' : '#dc2626', borderRadius: 2 } }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: (doc.confidence_score || 0) >= 0.8 ? '#059669' : '#dc2626' }}>{Math.round((doc.confidence_score || 0) * 100)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip status={doc.status.toUpperCase()} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Review"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Download"><IconButton size="small" onClick={(e) => e.stopPropagation()}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={(e) => e.stopPropagation()} sx={{ color: theme.palette.error.main, opacity: 0.5, '&:hover': { opacity: 1 } }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredDocs.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload PDF Document</DialogTitle>
        <DialogContent>
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              mt: 2, p: 6, border: '2px dashed', borderColor: theme.palette.divider, borderRadius: 3,
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s, bgcolor 0.2s',
              '&:hover': { borderColor: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}08` },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>PDF files up to 50MB</Typography>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} hidden />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setUploadOpen(false); setSelectedFile(null); }} variant="outlined" disabled={uploading}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
