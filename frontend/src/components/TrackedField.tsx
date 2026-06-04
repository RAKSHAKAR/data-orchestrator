import { useState } from 'react';
import { Box, TextField, Typography, Tooltip, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/Person';

interface TrackedFieldProps {
  label: string;
  originalValue: string;
  value: string;
  isManuallyUpdated: boolean;
  isAiExtracted?: boolean;
  updatedBy?: string;
  updatedOn?: string;
  onChange: (newValue: string) => void;
}

export const TrackedField = ({ label, originalValue, value, isManuallyUpdated, isAiExtracted = true, updatedBy, updatedOn, onChange }: TrackedFieldProps) => {
  const [currentValue, setCurrentValue] = useState(value);

  const handleBlur = () => {
    if (currentValue !== value) {
      onChange(currentValue);
    }
  };

  return (
    <Box sx={{ mb: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>{label}</Typography>
        
        {isAiExtracted && !isManuallyUpdated && (
          <SmartToyOutlinedIcon sx={{ ml: 1, fontSize: 16, color: '#22c55e' }} />
        )}
        
        {!isAiExtracted && !isManuallyUpdated && (
           <PersonIcon sx={{ ml: 1, fontSize: 16, color: '#64748b' }} />
        )}

        {isManuallyUpdated && (
          <Tooltip title={`Original: ${originalValue} | Updated by: ${updatedBy} | On: ${updatedOn}`}>
            <Chip 
              icon={<EditIcon fontSize="small" />} 
              label="Manually Updated" 
              size="small" 
              color="warning" 
              variant="outlined" 
              sx={{ ml: 1, height: 20, fontSize: '0.65rem', backgroundColor: '#fff9c4' }} 
            />
          </Tooltip>
        )}
      </Box>
      <TextField
        fullWidth
        size="small"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        sx={{
          backgroundColor: isManuallyUpdated ? 'rgba(255, 235, 59, 0.15)' : '#f8fafc',
          '& .MuiInputBase-input': {
             color: '#334155',
             fontWeight: 500,
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
          }
        }}
      />
    </Box>
  );
};
