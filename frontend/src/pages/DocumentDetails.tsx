import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Switch, Accordion, AccordionSummary,
  AccordionDetails, IconButton, Breadcrumbs, Link, useTheme, Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { TrackedField } from '../components/TrackedField';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { documentApi } from '../services/api';

/* ───────── TabPanel ───────── */
interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>{children}</Box>;
}

/* ───────── Accordion Section Helper ───────── */
const FieldSection = ({ title, defaultExpanded = true, children }: { title: string; defaultExpanded?: boolean; children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      elevation={0}
      disableGutters
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '10px !important',
        mb: 2,
        '&:before': { display: 'none' },
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', minHeight: 48, '& .MuiAccordionSummary-content': { my: 0 } }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, p: 2.5 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

/* ───────── Status Badge ───────── */
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    COMPLETED: { label: 'Completed', color: '#059669', bg: '#ecfdf5', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    VALIDATED: { label: 'Validated', color: '#2563eb', bg: '#eff6ff', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
    PENDING_VALIDATION: { label: 'Pending Validation', color: '#d97706', bg: '#fffbeb', icon: <PendingOutlinedIcon sx={{ fontSize: 14 }} /> },
    DATAEXTRACTED: { label: 'Data Extracted', color: '#7c3aed', bg: '#f5f3ff', icon: <DescriptionOutlinedIcon sx={{ fontSize: 14 }} /> },
    LOW_CONFIDENCE: { label: 'Low Confidence', color: '#dc2626', bg: '#fef2f2', icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
    FAILED: { label: 'Failed', color: '#dc2626', bg: '#fef2f2', icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
    PROCESSING: { label: 'Processing', color: '#0284c7', bg: '#f0f9ff', icon: <AccessTimeIcon sx={{ fontSize: 14 }} /> },
    'FILE UPLOADED': { label: 'File Uploaded', color: '#64748b', bg: '#f1f5f9', icon: <CloudUploadIcon sx={{ fontSize: 14 }} /> },
  };
  const normalizedStatus = status.replace('_', ' ').toUpperCase();
  const c = config[normalizedStatus] || config['PROCESSING'];
  return <Chip icon={c.icon as React.ReactElement} label={c.label} size="small" sx={{ color: c.color, bgcolor: c.bg, border: `1px solid ${c.color}30`, fontWeight: 600, fontSize: '0.75rem', height: 28, '& .MuiChip-icon': { color: c.color } }} />;
};

/* ───────── Component ───────── */
export const DocumentDetails = () => {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const [validationData, setValidationData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [showAiIcons, setShowAiIcons] = useState(true);

  useEffect(() => {
    const fetchAllDocs = async () => {
      try {
        const docs = await documentApi.getDocuments();
        setAllDocs(docs);
      } catch(e) {}
    };
    fetchAllDocs();
  }, []);

  const currentIndex = allDocs.findIndex(d => String(d.id) === String(_id));
  const prevDocId = currentIndex > 0 ? allDocs[currentIndex - 1].id : null;
  const nextDocId = currentIndex !== -1 && currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1].id : null;

  const [formData, setFormData] = useState({
    documentDate: 'N/A', processingDate: 'N/A', receivedDate: 'N/A',
    claimNumber: 'N/A', claimantName: 'N/A', claimantNumber: 'N/A', dateOfLoss: 'N/A', policyNumber: 'N/A',
    amountPaid: 'N/A', amountBilled: 'N/A', eightyPercentAmountBilled: 'N/A', amountOwed: 'N/A',
    provider: 'N/A', providerVendorId: 'N/A', firmName: 'N/A', firmAddress: 'N/A', firmVendorId: 'N/A',
    envelopeType: 'N/A', certifiedMail: 'N/A', certificationNumber: 'N/A', documentsInEnvelope: 'N/A',
    totalPostageCost: 'N/A', postageCostPerDocument: 'N/A', dateOfServiceFrom: 'N/A', dateOfServiceTo: 'N/A', assignmentOfBenefit: 'N/A',
  });

  useEffect(() => {
    const fetchDocument = async () => {
      if (!_id) return;
      setLoading(true);
      try {
        const data = await documentApi.getDocument(_id);
        setDocument(data);
        
        try {
          const auditData = await documentApi.getAuditHistory(_id);
          setEditedFields(auditData.edited_fields || []);
        } catch (e) {
          console.error('Failed to fetch audit history', e);
        }

        if (data.extracted_data) {
          setFormData({
            documentDate: data.extracted_data.document_date || 'N/A',
            processingDate: data.extracted_data.processing_date || 'N/A',
            receivedDate: data.extracted_data.received_date || 'N/A',
            claimNumber: data.extracted_data.claim_number || 'N/A',
            claimantName: data.extracted_data.claimant_name || 'N/A',
            claimantNumber: data.extracted_data.claimant_number || 'N/A',
            dateOfLoss: data.extracted_data.date_of_loss || 'N/A',
            policyNumber: data.extracted_data.policy_number || 'N/A',
            amountPaid: data.extracted_data.amount_paid || 'N/A',
            amountBilled: data.extracted_data.amount_billed || 'N/A',
            eightyPercentAmountBilled: data.extracted_data.eighty_percent_amount_billed || 'N/A',
            amountOwed: data.extracted_data.amount_owed || 'N/A',
            provider: data.extracted_data.provider || 'N/A',
            providerVendorId: data.extracted_data.provider_vendor_id || 'N/A',
            firmName: data.extracted_data.firm_name || 'N/A',
            firmAddress: data.extracted_data.firm_address || 'N/A',
            firmVendorId: data.extracted_data.firm_vendor_id || 'N/A',
            envelopeType: data.extracted_data.envelope_type || 'N/A',
            certifiedMail: data.extracted_data.certified_mail || 'N/A',
            certificationNumber: data.extracted_data.certification_number || 'N/A',
            documentsInEnvelope: data.extracted_data.documents_in_envelope || 'N/A',
            totalPostageCost: data.extracted_data.total_postage_cost || 'N/A',
            postageCostPerDocument: data.extracted_data.postage_cost_per_document || 'N/A',
            dateOfServiceFrom: data.extracted_data.date_of_service_from || 'N/A',
            dateOfServiceTo: data.extracted_data.date_of_service_to || 'N/A',
            assignmentOfBenefit: data.extracted_data.assignment_of_benefit || 'N/A',
          });
        }
      } catch (error) {
        console.error('Failed to fetch document', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [_id]);

  const handleSave = async () => {
    if (!_id) return;
    
    // Validate all fields before saving
    for (const [key, value] of Object.entries(formData)) {
      const errorMsg = getValidationRule(key as keyof typeof formData)(value);
      if (errorMsg) {
        alert(`Cannot save. Please fix the validation error in ${key.replace(/([A-Z])/g, ' $1').trim()}`);
        return;
      }
    }

    setSaving(true);
    try {
      const getVal = (v: string) => (v === 'N/A' || v === '') ? null : v;
      
      const updateData = {
        document_date: getVal(formData.documentDate),
        processing_date: getVal(formData.processingDate),
        received_date: getVal(formData.receivedDate),
        claim_number: getVal(formData.claimNumber),
        claimant_name: getVal(formData.claimantName),
        claimant_number: getVal(formData.claimantNumber),
        date_of_loss: getVal(formData.dateOfLoss),
        policy_number: getVal(formData.policyNumber),
        amount_paid: getVal(formData.amountPaid),
        amount_billed: getVal(formData.amountBilled),
        eighty_percent_amount_billed: getVal(formData.eightyPercentAmountBilled),
        amount_owed: getVal(formData.amountOwed),
        provider: getVal(formData.provider),
        provider_vendor_id: getVal(formData.providerVendorId),
        firm_name: getVal(formData.firmName),
        firm_address: getVal(formData.firmAddress),
        firm_vendor_id: getVal(formData.firmVendorId),
        envelope_type: getVal(formData.envelopeType),
        certified_mail: getVal(formData.certifiedMail),
        certification_number: getVal(formData.certificationNumber),
        documents_in_envelope: getVal(formData.documentsInEnvelope),
        total_postage_cost: getVal(formData.totalPostageCost),
        postage_cost_per_document: getVal(formData.postageCostPerDocument),
        date_of_service_from: getVal(formData.dateOfServiceFrom),
        date_of_service_to: getVal(formData.dateOfServiceTo),
        assignment_of_benefit: getVal(formData.assignmentOfBenefit),
      };
      await documentApi.updateExtractedData(_id, updateData);
      setIsEditing(false);
      setAuditLog([]); // clear manual edits tracking upon save
      
      // refresh doc to get new logs and audit
      const updatedDoc = await documentApi.getDocument(_id);
      setDocument(updatedDoc);
      try {
        const auditData = await documentApi.getAuditHistory(_id);
        setEditedFields(auditData.edited_fields || []);
      } catch (e) { }
    } catch (error) {
      console.error('Failed to save document data', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerValidation = async () => {
    if (!_id) return;
    setActionLoading(true);
    try {
      const res = await documentApi.triggerValidation(Number(_id));
      setValidationData(res);
      const updatedDoc = await documentApi.getDocument(_id);
      setDocument(updatedDoc);
    } catch (e) {
      console.error('Failed to trigger validation', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToGuidewire = async () => {
    if (!_id) return;
    setActionLoading(true);
    try {
      await documentApi.sendToGuidewire(Number(_id));
      const updatedDoc = await documentApi.getDocument(_id);
      setDocument(updatedDoc);
    } catch (e) {
      console.error('Failed to send to Guidewire', e);
    } finally {
      setActionLoading(false);
    }
  };

  const [auditLog, setAuditLog] = useState<Array<{ field: string; original: string; updatedBy: string; updatedOn: string }>>([]);

  const handleFieldChange = (field: string, newValue: string) => {
    if (formData[field as keyof typeof formData] !== newValue) {
      const originalValue = formData[field as keyof typeof formData];
      setAuditLog((prev) => [...prev, { field, original: originalValue, updatedBy: 'Admin User', updatedOn: new Date().toLocaleString() }]);
      setFormData((prev) => ({ ...prev, [field]: newValue }));
    }
  };

  const getFieldAudit = (field: string) => auditLog.find((l) => l.field === field);
  
  // Convert JS camelCase key to snake_case for DB match
  const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const isFieldUpdated = (field: string) => auditLog.some((l) => l.field === field) || editedFields.includes(toSnakeCase(field));

  const getValidationRule = (key: keyof typeof formData) => {
    return (val: string) => {
      if (!val || val === 'N/A') return '';
      
      if (['documentDate', 'processingDate', 'receivedDate', 'dateOfLoss', 'dateOfServiceFrom', 'dateOfServiceTo'].includes(key)) {
        const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/;
        if (!dateRegex.test(val)) {
          return 'Use YYYY-MM-DD or MM/DD/YYYY format';
        }
      }

      if (['amountPaid', 'amountBilled', 'eightyPercentAmountBilled', 'amountOwed', 'totalPostageCost', 'postageCostPerDocument'].includes(key)) {
        const cleanVal = val.replace(/[\$,\s]/g, '');
        if (isNaN(Number(cleanVal)) || cleanVal === '') {
          return 'Enter a valid number or currency format';
        }
      }
      
      return '';
    };
  };

  const renderField = (key: keyof typeof formData, label: string) => (
    <TrackedField
      label={label}
      value={formData[key]}
      isManuallyUpdated={isFieldUpdated(key)}
      showIcons={showAiIcons}
      isEditing={isEditing}
      validate={getValidationRule(key)}
      onChange={(val) => handleFieldChange(key, val)}
    />
  );

  /* ─── Validation Data ─── */
  const getValidationRows = () => {
    if (validationData) {
      return [
        { field: 'Claim Number', fromLetter: formData.claimNumber, fromGuidewire: validationData.mock_guidewire_data.claim_number, match: formData.claimNumber === validationData.mock_guidewire_data.claim_number },
        { field: 'Claimant Name', fromLetter: formData.claimantName, fromGuidewire: validationData.mock_guidewire_data.claimant_name, match: formData.claimantName === validationData.mock_guidewire_data.claimant_name },
        { field: 'Amount Billed', fromLetter: formData.amountBilled, fromGuidewire: validationData.mock_guidewire_data.amount_billed, match: formData.amountBilled === validationData.mock_guidewire_data.amount_billed },
        { field: 'Provider', fromLetter: formData.provider, fromGuidewire: validationData.mock_guidewire_data.provider, match: formData.provider === validationData.mock_guidewire_data.provider },
      ];
    }
    // Default mock rows if validation not yet triggered
    return [
      { field: 'Claim Number', fromLetter: formData.claimNumber, fromGuidewire: 'N/A', match: false },
      { field: 'Date of Loss', fromLetter: formData.dateOfLoss, fromGuidewire: 'N/A', match: false },
      { field: 'Claimant Name', fromLetter: formData.claimantName, fromGuidewire: 'N/A', match: false },
      { field: 'Policy Number', fromLetter: formData.policyNumber, fromGuidewire: 'N/A', match: false },
      { field: 'Amount Billed', fromLetter: formData.amountBilled, fromGuidewire: formData.amountBilled, match: true },
      { field: 'Amount Owed', fromLetter: formData.amountOwed, fromGuidewire: 'N/A', match: false },
    ];
  };
  const validationRows = getValidationRows();

  /* ─── Log Data ─── */
  const logRows = document?.processing_logs || [];

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><Typography>Loading document details...</Typography></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>

      {/* ───── TOP ACTION BAR ───── */}
      <Paper elevation={0} sx={{ p: 2, px: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          
            <IconButton onClick={() => navigate('/')} size="small"><ArrowBackIcon fontSize="small" /></IconButton>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Box>
            <Breadcrumbs separator="›" sx={{ '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}>
              <Link underline="hover" color="text.secondary" sx={{ cursor: 'pointer', fontSize: '0.8125rem' }} onClick={() => navigate('/')}>Dashboard</Link>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>{document?.file_name || 'Document'}</Typography>
            </Breadcrumbs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Claim # <strong style={{ color: theme.palette.text.primary }}>{formData.claimNumber}</strong></Typography>
              <StatusBadge status={document?.status?.toUpperCase() || 'PENDING_VALIDATION'} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton 
            size="small" 
            disabled={!prevDocId} 
            onClick={() => navigate(`/documents/${prevDocId}`)}
          >
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton 
            size="small" 
            disabled={!nextDocId} 
            onClick={() => navigate(`/documents/${nextDocId}`)}
          >
            <NavigateNextIcon />
          </IconButton>
          {tabValue === 0 && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              {isEditing ? (
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} size="small" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} size="small">Edit</Button>
              )}
            </>
          )}
          
            <Button variant="contained" color="primary" startIcon={<SendIcon />} size="small" onClick={handleTriggerValidation} disabled={actionLoading}>
              {actionLoading ? 'Validating...' : 'Trigger Validation'}
            </Button>
          
        </Box>
      </Paper>

      {/* ───── MAIN WORKSPACE ───── */}
      <Paper elevation={0} sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafbfc' }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ minHeight: 44, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 44, py: 0 } }}
          >
            <Tab label="Data Extraction" />
            <Tab label="Data Validation" />
            <Tab label={`System Logs (${logRows.length})`} />
          </Tabs>
        </Box>

        {/* ─── TAB 0: Data Extraction ─── */}
        <TabPanel value={tabValue} index={0}>
          {/* AI Status Bar */}
          <Paper elevation={0} sx={{ p: 2, mb: 3, border: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SmartToyOutlinedIcon sx={{ color: '#059669' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>AI Bot Extraction</Typography>
                <Typography variant="caption" color="text.secondary">All fields extracted via OCR + AI</Typography>
              </Box>
              <Switch checked={showAiIcons} onChange={(e) => setShowAiIcons(e.target.checked)} color="success" size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Accuracy</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                  {document?.accuracy_score != null ? `${Math.round(document.accuracy_score * 100)}%` : 'N/A'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Confidence</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  {document?.confidence_score != null ? `${Math.round(document.confidence_score * 100)}%` : 'N/A'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Fields Extracted</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>26 / 26</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Split: PDF + Form */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>

            {/* PDF Viewer */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, position: 'sticky', top: 0 }}>

              <Paper
                elevation={0}
                sx={{
                  height: { xs: 500, lg: 'calc(100vh - 370px)' },
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {document ? (
                  <iframe 
                    src={`http://127.0.0.1:8000/api/v1/documents/${document.id}/file`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                    title={document.file_name}
                  />
                ) : (
                  <>
                    <DescriptionOutlinedIcon sx={{ fontSize: 56, color: '#475569', opacity: 0.5 }} />
                    <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>PDF Viewer Placeholder</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>No file</Typography>
                  </>
                )}
              </Paper>
            </Box>

            {/* Fields Form */}
            <Box>
              <FieldSection title="📋 Basic Information">
                {renderField('documentDate', 'Document Date')}
                {renderField('receivedDate', 'Received Date')}
                {renderField('processingDate', 'Processing Date')}
              </FieldSection>

              <FieldSection title="📝 Claim Details">
                {renderField('claimNumber', 'Claim Number')}
                {renderField('claimantName', 'Claimant Name')}
                {renderField('claimantNumber', 'Claimant Number')}
                {renderField('dateOfLoss', 'Date of Loss')}
                {renderField('policyNumber', 'Policy Number')}
              </FieldSection>

              <FieldSection title="💰 Financial Information" defaultExpanded={false}>
                {renderField('amountBilled', 'Amount Billed')}
                {renderField('eightyPercentAmountBilled', '80% Amount Billed')}
                {renderField('amountOwed', 'Amount Owed')}
                {renderField('amountPaid', 'Amount Paid')}
              </FieldSection>

              <FieldSection title="🏢 Provider & Firm" defaultExpanded={false}>
                {renderField('provider', 'Provider')}
                {renderField('providerVendorId', 'Provider Vendor ID')}
                {renderField('firmName', 'Firm Name')}
                {renderField('firmAddress', 'Firm Address')}
                {renderField('firmVendorId', 'Firm Vendor ID')}
              </FieldSection>

              <FieldSection title="📮 Mailing & Service Details" defaultExpanded={false}>
                {renderField('envelopeType', 'Envelope Type')}
                {renderField('certifiedMail', 'Certified Mail')}
                {renderField('certificationNumber', 'Certification Number')}
                {renderField('documentsInEnvelope', 'Documents in Envelope')}
                {renderField('totalPostageCost', 'Total Postage Cost')}
                {renderField('postageCostPerDocument', 'Postage Cost Per Doc')}
                {renderField('dateOfServiceFrom', 'Service Date From')}
                {renderField('dateOfServiceTo', 'Service Date To')}
                {renderField('assignmentOfBenefit', 'Assignment of Benefit')}
              </FieldSection>
            </Box>
          </Box>
        </TabPanel>

        {/* ─── TAB 1: Data Validation ─── */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Guidewire Validation</Typography>
              <Typography variant="body2" color="text.secondary">Compare extracted data with Guidewire records</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {!validationData && <Button variant="outlined" size="small">API Not Validated</Button>}
              <Button variant="contained" startIcon={<SendIcon />} size="small" onClick={handleTriggerValidation} disabled={actionLoading}>Trigger Validation</Button>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' }}>
                  <TableCell>Validation Field</TableCell>
                  <TableCell>From Letter (OCR)</TableCell>
                  <TableCell>From Guidewire</TableCell>
                  <TableCell align="center">Match</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validationRows.map((row) => (
                  <TableRow key={row.field} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.field}</TableCell>
                    <TableCell>{row.fromLetter}</TableCell>
                    <TableCell sx={{ color: row.fromGuidewire === 'N/A' ? 'text.secondary' : 'text.primary' }}>{row.fromGuidewire}</TableCell>
                    <TableCell align="center">
                      {row.match ? (
                        <Chip icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />} label="Match" size="small" sx={{ color: '#059669', bgcolor: '#ecfdf5', border: '1px solid #05966930', fontWeight: 600, fontSize: '0.75rem', height: 26, '& .MuiChip-icon': { color: '#059669' } }} />
                      ) : (
                        <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label="Mismatch" size="small" sx={{ color: '#dc2626', bgcolor: '#fef2f2', border: '1px solid #dc262630', fontWeight: 600, fontSize: '0.75rem', height: 26, '& .MuiChip-icon': { color: '#dc2626' } }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper elevation={0} sx={{ mt: 4, p: 4, border: `2px dashed ${theme.palette.divider}`, textAlign: 'center' }}>
            
              <span>
                <Button 
                  disabled={document?.status !== 'VALIDATED' || actionLoading} 
                  variant="contained" 
                  size="large" 
                  sx={{ px: 6, mb: 1.5 }}
                  onClick={handleSendToGuidewire}
                >
                  Send to Guidewire
                </Button>
              </span>
            
            <Typography variant="body2" color="text.secondary">
              {document?.status === 'VALIDATED' 
                ? 'Document is fully validated and ready to be sent.' 
                : 'All fields must match the Guidewire system before sending is allowed.'}
            </Typography>
          </Paper>
        </TabPanel>

        {/* ─── TAB 2: System Logs ─── */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Processing History</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc' }}>
                  <TableCell>Log ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logRows.map((row: any, i: number) => {
                  // Determine coloring based on status
                  const statusLabel = row.status || 'UNKNOWN';
                  let statusColor = '#64748b';
                  let statusBg = '#f1f5f9';
                  if (statusLabel === 'DataExtracted' || statusLabel === 'DATA_EXTRACTED') { statusColor = '#7c3aed'; statusBg = '#f5f3ff'; }
                  else if (statusLabel === 'Processing') { statusColor = '#0284c7'; statusBg = '#f0f9ff'; }
                  else if (statusLabel === 'Failed') { statusColor = '#dc2626'; statusBg = '#fef2f2'; }
                  else if (statusLabel === 'Completed' || statusLabel === 'Validated') { statusColor = '#059669'; statusBg = '#ecfdf5'; }

                  return (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>#{row.id}</Typography></TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{new Date(row.created_at).toLocaleString()}</Typography></TableCell>
                      <TableCell><Chip label={statusLabel} size="small" sx={{ color: statusColor, bgcolor: statusBg, border: `1px solid ${statusColor}30`, fontWeight: 600, fontSize: '0.75rem', height: 26 }} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};
