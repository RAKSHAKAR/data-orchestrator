import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, IconButton, MenuItem, Select,
  FormControl, LinearProgress,
  TablePagination, useTheme, TableSortLabel, Dialog, DialogTitle, DialogContent, CircularProgress
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

/* ───────── Metric Card ───────── */
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
  progress?: number;
  onClick?: () => void;
}

const MetricCard = ({ title, value, icon, color, bgColor, progress, onClick }: MetricCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.75,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          borderColor: color,
          boxShadow: `0 0 0 1px ${color}22`,
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.35, lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        {icon && color && bgColor && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              flexShrink: 0,
              '& > svg': { fontSize: '1.15rem' }
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {progress !== undefined && (
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: color ? `${color}15` : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
              '& .MuiLinearProgress-bar': { bgcolor: color || theme.palette.primary.main, borderRadius: 2 },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

/* ───────── Status Chip ───────── */
const StatusChip = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    COMPLETED: { label: 'Completed', color: '#059669', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    VALIDATED: { label: 'Validated', color: '#2563eb', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    PENDING_VALIDATION: { label: 'Pending Validation', color: '#d97706', icon: <InsertDriveFileOutlinedIcon sx={{ fontSize: 14 }} /> },
    DATAEXTRACTED: { label: 'Data Extracted', color: '#7c3aed', icon: <DescriptionOutlinedIcon sx={{ fontSize: 14 }} /> },
    LOW_CONFIDENCE: { label: 'Low Confidence', color: '#d97706', icon: <InsertDriveFileOutlinedIcon sx={{ fontSize: 14 }} /> },
    FAILED: { label: 'Failed', color: '#dc2626', icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
    PROCESSING: { label: 'Processing', color: '#0284c7', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
    UPLOADED: { label: 'Uploaded', color: '#64748b', icon: <CloudUploadIcon sx={{ fontSize: 14 }} /> },
  };

  const normalizedStatus = status.replace('_', '').toUpperCase();
  const c = config[normalizedStatus] || config['PROCESSING'];

  return (
    <Chip
      icon={c.icon as React.ReactElement}
      label={c.label}
      size="small"
      variant="outlined"
      sx={{
        color: c.color,
        borderColor: c.color,
        bgcolor: 'transparent',
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 26,
        borderRadius: 16,
        '& .MuiChip-icon': { color: c.color },
      }}
    />
  );
};

/* ───────── Dashboard Component ───────── */
export const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.email === 'admin@demo.com' || user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  type Order = 'asc' | 'desc';
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<string>('processing_date');

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setUploadSuccess(true);
      await fetchDocuments();
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess(false);
        setFile(null);
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchDocuments = async () => {
    try {
      const data = await documentApi.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const documentIds = filteredDocs.map(d => d.id);
      await documentApi.exportExcel(documentIds);
    } catch (e) {
      console.error('Failed to export', e);
      alert('Failed to export to Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSend = async () => {
    const validatedDocs = documents.filter(d => d.status.toUpperCase() === 'VALIDATED');
    if (validatedDocs.length === 0) return;
    
    setLoading(true);
    try {
      const ids = validatedDocs.map(d => d.id);
      await documentApi.bulkSendGuidewire(ids);
      await fetchDocuments();
    } catch (e) {
      console.error('Failed to bulk send to Guidewire', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const hasPending = documents.some(d => 
      ['FILE UPLOADED', 'PROCESSING', 'DATA EXTRACTED', 'VALIDATED'].includes(d.status.replace('_', ' ').toUpperCase())
    );
    
    if (hasPending) {
      const interval = setInterval(fetchDocuments, 3000);
      return () => clearInterval(interval);
    }
  }, [documents]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.extracted_data?.claim_number || '').includes(searchTerm) ||
      (doc.extracted_data?.claimant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.extracted_data?.firm_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      const docStatus = doc.status.toUpperCase();
      matchesStatus = docStatus === statusFilter.replace('_', '').toUpperCase() || docStatus === statusFilter.toUpperCase();
    }

    return matchesSearch && matchesStatus;
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let aVal: any = '';
    let bVal: any = '';

    switch (orderBy) {
      case 'file_name':
        aVal = a.file_name?.toLowerCase() || ''; bVal = b.file_name?.toLowerCase() || ''; break;
      case 'claim_number':
        aVal = a.extracted_data?.claim_number?.toLowerCase() || ''; bVal = b.extracted_data?.claim_number?.toLowerCase() || ''; break;
      case 'claimant_name':
        aVal = a.extracted_data?.claimant_name?.toLowerCase() || ''; bVal = b.extracted_data?.claimant_name?.toLowerCase() || ''; break;
      case 'firm_name':
        aVal = a.extracted_data?.firm_name?.toLowerCase() || ''; bVal = b.extracted_data?.firm_name?.toLowerCase() || ''; break;
      case 'processing_date':
        aVal = new Date(a.extracted_data?.processing_date || a.created_at).getTime() || 0; 
        bVal = new Date(b.extracted_data?.processing_date || b.created_at).getTime() || 0; 
        break;
      case 'amount_billed':
        aVal = parseFloat((a.extracted_data?.amount_billed || '0').replace(/[^0-9.-]+/g,""));
        bVal = parseFloat((b.extracted_data?.amount_billed || '0').replace(/[^0-9.-]+/g,""));
        break;
      case 'confidence_score':
        aVal = a.confidence_score || 0; bVal = b.confidence_score || 0; break;
      case 'status':
        aVal = a.status?.toLowerCase() || ''; bVal = b.status?.toLowerCase() || ''; break;
    }

    if (bVal < aVal) return order === 'desc' ? -1 : 1;
    if (bVal > aVal) return order === 'desc' ? 1 : -1;
    return 0;
  });

  const getMetric = (status: string) => documents.filter(d => d.status.replace('_', '').toUpperCase() === status.replace('_', '').toUpperCase()).length;
  const uploadedCount = getMetric('UPLOADED');
  const processingCount = getMetric('PROCESSING');
  const extractedCount = getMetric('DATA_EXTRACTED');
  const pendingValidationCount = getMetric('PENDING_VALIDATION');
  const validatedCount = getMetric('VALIDATED');
  const completedCount = getMetric('COMPLETED');
  const lowConfidenceCount = getMetric('LOW_CONFIDENCE');
  const failedCount = getMetric('FAILED');

  const avgConfidence = documents.length > 0 
    ? Math.round(documents.reduce((acc, d) => acc + (d.confidence_score || 0), 0) / documents.length * 100) 
    : 0;
  const avgAccuracy = documents.length > 0 
    ? Math.round(documents.reduce((acc, d) => acc + (d.accuracy_score || 0), 0) / documents.length * 100) 
    : 0;
    
  const avgTimeTaken = documents.length > 0 ? "00:02:14" : "00:00:00";
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>

      {/* ───── HEADER ───── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 700 }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time document processing analytics and management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'nowrap', width: { xs: '100%', md: 'auto' } }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} size="small" onClick={handleExport} sx={{ flex: { xs: 1, sm: '0 0 auto' }, whiteSpace: 'nowrap', minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } } }}>Export</Button>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} size="small" onClick={() => setUploadModalOpen(true)} sx={{ flex: { xs: 1, sm: '0 0 auto' }, whiteSpace: 'nowrap', minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } } }}>Upload</Button>
        </Box>
      </Box>

      {/* ───── TOP FILTER BAR ───── */}
      <Paper elevation={0} sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Date</Typography>
          <TextField
            size="small"
            type="date"
            sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' } }}
            slotProps={{
              inputLabel: { shrink: true }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Search By</Typography>
          <TextField
            size="small"
            placeholder="File Name / Claim # / Firm Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' } }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 1, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' }}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="UPLOADED">Uploaded</MenuItem>
              <MenuItem value="PROCESSING">Processing</MenuItem>
              <MenuItem value="DATA_EXTRACTED">Data Extracted</MenuItem>
              <MenuItem value="PENDING_VALIDATION">Pending Validation</MenuItem>
              <MenuItem value="VALIDATED">Validated</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="LOW_CONFIDENCE">Low Confidence</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <IconButton size="small" onClick={fetchDocuments} disabled={loading} sx={{ ml: 'auto' }}>
          <SyncIcon fontSize="large" sx={{ color: 'text.secondary', animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
        </IconButton>
      </Paper>

      {/* ───── LAYOUT CONTAINER ───── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, flex: 1 }}>
        
        {/* LEFT COLUMN: METRICS & ACTIONS */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          width: { xs: '100%', md: '360px', lg: '420px' }, 
          flexShrink: 0,
          pr: { xs: 0, md: 1 }
        }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <MetricCard title="Total Documents" value={documents.length} icon={<ArticleOutlinedIcon />} color="#2563eb" bgColor="#eff6ff" onClick={() => setStatusFilter('All')} />
            <MetricCard title="Avg Time Taken" value={avgTimeTaken} icon={<AccessTimeIcon />} color="#64748b" bgColor="#f1f5f9" />
            <MetricCard title="Uploaded" value={uploadedCount} icon={<CloudUploadIcon />} color="#6366f1" bgColor="#e0e7ff" onClick={() => setStatusFilter('UPLOADED')} />
            <MetricCard title="Processing" value={processingCount} icon={<SyncIcon />} color="#3b82f6" bgColor="#dbeafe" onClick={() => setStatusFilter('PROCESSING')} />
            <MetricCard title="Extracted" value={extractedCount} icon={<DescriptionOutlinedIcon />} color="#8b5cf6" bgColor="#ede9fe" onClick={() => setStatusFilter('DATA_EXTRACTED')} />
            <MetricCard title="Filtered Records" value={filteredDocs.length} icon={<SearchIcon />} color="#0ea5e9" bgColor="#e0f2fe" />
            <MetricCard title="Pending Validation" value={pendingValidationCount} icon={<PendingOutlinedIcon />} color="#d97706" bgColor="#fffbeb" onClick={() => setStatusFilter('PENDING_VALIDATION')} />
            <MetricCard title="Api Not Validated" value={getMetric('API_NOT_VALIDATED')} icon={<WarningAmberIcon />} color="#ef4444" bgColor="#fee2e2" onClick={() => setStatusFilter('API_NOT_VALIDATED')} />
            <MetricCard title="Validated" value={validatedCount} icon={<CheckCircleOutlineIcon />} color="#059669" bgColor="#ecfdf5" onClick={() => setStatusFilter('VALIDATED')} />
            <MetricCard title="Completed" value={completedCount} icon={<CheckCircleOutlineIcon />} color="#059669" bgColor="#ecfdf5" onClick={() => setStatusFilter('COMPLETED')} />
            <MetricCard title="Low Confidence" value={lowConfidenceCount} icon={<WarningAmberIcon />} color="#f59e0b" bgColor="#fef3c7" onClick={() => setStatusFilter('LOW_CONFIDENCE')} />
            <MetricCard title="Failed" value={failedCount} icon={<ErrorOutlineIcon />} color="#dc2626" bgColor="#fef2f2" onClick={() => setStatusFilter('FAILED')} />
            <MetricCard title="AI Accuracy" value={`${avgAccuracy}%`} icon={<TrendingUpIcon />} color="#059669" bgColor="#ecfdf5" progress={avgAccuracy} />
            <MetricCard title="AI Confidence" value={`${avgConfidence}%`} icon={<TrendingUpIcon />} color="#2563eb" bgColor="#eff6ff" progress={avgConfidence} />
          </Box>

          <Box sx={{ mt: 'auto', pt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
            <Button 
              variant="contained" 
              size="small" 
              sx={{ flex: 1, fontSize: '0.75rem', py: 1 }}
              onClick={() => {
                // Mock behavior: move pending to api not validated
                alert('Moved PV files to API Not Validate');
              }}
            >
              Move PV Files to API Not Validate
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleBulkSend}
              disabled={documents.filter(d => d.status.toUpperCase() === 'VALIDATED').length === 0 || loading}
              sx={{ flex: 1, fontSize: '0.75rem', py: 1 }}
            >
              Send Validated to Guidewire
            </Button>
          </Box>
        </Box>

        {/* RIGHT COLUMN: DATA GRID */}
      <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Table */}
        <TableContainer sx={{ flex: 1, overflowX: 'auto', width: '100%' }}>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'file_name'} direction={orderBy === 'file_name' ? order : 'asc'} onClick={() => handleRequestSort('file_name')}>FILE NAME</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'claim_number'} direction={orderBy === 'claim_number' ? order : 'asc'} onClick={() => handleRequestSort('claim_number')}>CLAIM #</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'claimant_name'} direction={orderBy === 'claimant_name' ? order : 'asc'} onClick={() => handleRequestSort('claimant_name')}>CLAIMANT</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'firm_name'} direction={orderBy === 'firm_name' ? order : 'asc'} onClick={() => handleRequestSort('firm_name')}>FIRM NAME</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'processing_date'} direction={orderBy === 'processing_date' ? order : 'asc'} onClick={() => handleRequestSort('processing_date')}>PROCESSING DATE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'amount_billed'} direction={orderBy === 'amount_billed' ? order : 'asc'} onClick={() => handleRequestSort('amount_billed')}>AMOUNT</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'confidence_score'} direction={orderBy === 'confidence_score' ? order : 'asc'} onClick={() => handleRequestSort('confidence_score')}>CONFIDENCE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => handleRequestSort('status')}>STATUS</TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={20} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No documents found matching your criteria.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedDocs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((doc) => (
                  <TableRow
                    key={doc.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { borderBottom: 0 },
                      transition: 'background-color 0.15s',
                    }}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{doc.file_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{doc.extracted_data?.claim_number || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.claimant_name || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.firm_name || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.processing_date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.extracted_data?.amount_billed || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 140 }}>
                      {doc.confidence_score !== undefined && doc.confidence_score !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ flexGrow: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', bgcolor: doc.confidence_score >= 0.8 ? 'success.main' : 'error.main', width: `${doc.confidence_score * 100}%` }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: doc.confidence_score >= 0.8 ? 'success.main' : 'error.main', fontWeight: 600 }}>{Math.round(doc.confidence_score * 100)}%</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusChip status={doc.status.toUpperCase()} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
                        
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:8000/api/v1/documents/${doc.id}/file`, '_blank'); }}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        
                        {isAdmin && (
                          
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this document?')) {
                                documentApi.deleteDocument(doc.id).then(() => fetchDocuments());
                              }
                            }} sx={{ color: theme.palette.error.main, opacity: 0.5, '&:hover': { opacity: 1 } }}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredDocs.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
        />
      </Paper>
      </Box>

      {/* ───── UPLOAD MODAL ───── */}
      <Dialog 
        open={uploadModalOpen} 
        onClose={() => !uploading && setUploadModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Upload Document</Typography>
            <Typography variant="body2" color="text.secondary">Upload standard or scanned PDFs</Typography>
          </Box>
          <IconButton onClick={() => !uploading && setUploadModalOpen(false)} disabled={uploading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          
            <Paper
              elevation={0}
              sx={{
                p: 6,
                mt: 1,
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
              
              {uploadSuccess ? (
                <Box sx={{ textAlign: 'center' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
                  <Typography variant="h6">Upload Successful!</Typography>
                </Box>
              ) : file ? (
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6">{file.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="outlined" onClick={() => setFile(null)} disabled={uploading}>
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={handleUpload} disabled={uploading} startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}>
                      {uploading ? 'Processing...' : 'Confirm Upload'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <CloudUploadIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Drag & Drop your PDF here</Typography>
                  <Typography variant="body2" color="text.secondary">or click to browse your files</Typography>
                  <Button variant="contained" onClick={() => inputRef.current?.click()} sx={{ mt: 2, px: 4, borderRadius: 2 }}>
                    Browse Files
                  </Button>
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Need a test file?</Typography>
                    <Button 
                      href={documentApi.downloadSampleUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      size="small" 
                      startIcon={<DownloadIcon />} 
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Download Sample
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          
        </DialogContent>
      </Dialog>

    </Box>
  );
};
