import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, IconButton, MenuItem, Select,
  FormControl, InputAdornment, LinearProgress, Tooltip, InputLabel,
  TablePagination, useTheme
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../services/api';

/* ───────── Metric Card ───────── */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  progress?: number;
}

const MetricCard = ({ title, value, icon, color, bgColor, progress }: MetricCardProps) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 0 1px ${color}22`,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5, lineHeight: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
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
              bgcolor: `${color}15`,
              '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

/* ───────── Status Chip ───────── */
const StatusChip = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    COMPLETED: { label: 'Completed', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    VALIDATED: { label: 'Validated', color: '#2563eb', bg: '#eff6ff', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    PENDING_VALIDATION: { label: 'Pending Validation', color: '#d97706', bg: '#fffbeb', icon: <PendingOutlinedIcon sx={{ fontSize: 14 }} /> },
    DATA_EXTRACTED: { label: 'Data Extracted', color: '#7c3aed', bg: '#f5f3ff', icon: <DescriptionOutlinedIcon sx={{ fontSize: 14 }} /> },
    LOW_CONFIDENCE: { label: 'Low Confidence', color: '#dc2626', bg: '#fef2f2', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
    FAILED: { label: 'Failed', color: '#dc2626', bg: '#fef2f2', icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
    PROCESSING: { label: 'Processing', color: '#0284c7', bg: '#f0f9ff', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
  };

  const c = config[status] || config['PROCESSING'];

  return (
    <Chip
      icon={c.icon as React.ReactElement}
      label={c.label}
      size="small"
      sx={{
        color: c.color,
        bgcolor: c.bg,
        border: `1px solid ${c.color}30`,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 26,
        '& .MuiChip-icon': { color: c.color },
      }}
    />
  );
};



/* ───────── Dashboard Component ───────── */
export const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.extracted_data?.claim_number || '').includes(searchTerm) ||
      (doc.extracted_data?.claimant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.extracted_data?.firm_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || doc.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

      {/* ───── HEADER ───── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'text.primary' }}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time document processing analytics and management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} size="small">Export</Button>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} size="small" onClick={() => navigate('/upload')}>Upload PDF</Button>
          <Button variant="contained" startIcon={<SendIcon />} size="small">Send Validated to Guidewire</Button>
        </Box>
      </Box>

      {/* ───── METRICS GRID ───── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' }, gap: 2 }}>
        <MetricCard title="Total Documents" value={documents.length} icon={<ArticleOutlinedIcon />} color="#2563eb" bgColor="#eff6ff" />
        <MetricCard title="Completed" value={documents.filter(d => d.status === 'Completed' || d.status === 'COMPLETED').length} icon={<CheckCircleOutlineIcon />} color="#059669" bgColor="#ecfdf5" />
        <MetricCard title="Pending" value="1" icon={<PendingOutlinedIcon />} color="#d97706" bgColor="#fffbeb" />
        <MetricCard title="Low Confidence" value="1" icon={<WarningAmberIcon />} color="#dc2626" bgColor="#fef2f2" />
        <MetricCard title="API Not Validated" value="0" icon={<GppBadOutlinedIcon />} color="#7c3aed" bgColor="#f5f3ff" />
        <MetricCard title="AI Accuracy" value="96.8%" icon={<TrendingUpIcon />} color="#059669" bgColor="#ecfdf5" progress={97} />
        <MetricCard title="AI Confidence" value="86.9%" icon={<TrendingUpIcon />} color="#2563eb" bgColor="#eff6ff" progress={87} />
      </Box>

      {/* ───── DATA GRID ───── */}
      <Paper elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Filter Bar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fafbfc', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 280, flex: '0 1 350px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="PENDING_VALIDATION">Pending Validation</MenuItem>
              <MenuItem value="VALIDATED">Validated</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="LOW_CONFIDENCE">Low Confidence</MenuItem>
              <MenuItem value="DATA_EXTRACTED">Data Extracted</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchDocuments} disabled={loading}>
              <SyncIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Table */}
        <TableContainer sx={{ flex: 1, overflowX: 'auto' }}>
          <Table stickyHeader sx={{ minWidth: 2000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>File Name</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Document Date</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Claim Number</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Claimant Name</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Claimant Number</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Firm Name</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Firm Address</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Provider</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Policy Number</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Date of Loss</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Date of Service (From-To)</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Amount Billed</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>80% Amount Billed</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Amount Paid</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Amount Owed</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Total Postage Cost</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Certification Number</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Documents in Env</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', whiteSpace: 'nowrap' }}>Status</TableCell>
                <TableCell sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', position: 'sticky', right: 0, zIndex: 2 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No documents found matching your criteria.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((doc) => (
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
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.document_date || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{doc.extracted_data?.claim_number || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.claimant_name || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.claimant_number || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.firm_name || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={doc.extracted_data?.firm_address || ''}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{doc.extracted_data?.firm_address || 'N/A'}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.provider || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.policy_number || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.date_of_loss || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {doc.extracted_data?.date_of_service_from || 'N/A'} - {doc.extracted_data?.date_of_service_to || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.extracted_data?.amount_billed || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.eighty_percent_amount_billed || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.amount_paid || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>{doc.extracted_data?.amount_owed || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.total_postage_cost || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.certification_number || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.extracted_data?.documents_in_envelope || 'N/A'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusChip status={doc.status.toUpperCase()} /></TableCell>
                    <TableCell align="center" sx={{ position: 'sticky', right: 0, bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff', zIndex: 1, boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)' }}>
                      <Tooltip title="Review Document">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
                          sx={{ color: theme.palette.primary.main }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
  );
};
