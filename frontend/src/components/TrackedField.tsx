import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Tooltip, Chip, useTheme } from '@mui/material';
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
  isEditing?: boolean;
  onChange: (newValue: string) => void;
}

export const TrackedField = ({ label, originalValue, value, isManuallyUpdated, isAiExtracted = true, updatedBy, updatedOn, isEditing = true, onChange }: TrackedFieldProps) => {
  const theme = useTheme();
  const [currentValue, setCurrentValue] = useState(value);

  // Sync internal state when parent value changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

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
          <Tooltip title={`This field was automatically extracted by AI/OCR from the uploaded document`} arrow>
            <SmartToyOutlinedIcon sx={{ ml: 1, fontSize: 16, color: '#22c55e' }} />
          </Tooltip>
        )}
        
        {!isAiExtracted && !isManuallyUpdated && (
          <Tooltip title="This field was manually entered by a user" arrow>
            <PersonIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.text.secondary }} />
          </Tooltip>
        )}

        {isManuallyUpdated && (
          <Tooltip title={`Original value: "${originalValue}" | Updated by: ${updatedBy || 'Unknown'} | On: ${updatedOn || 'N/A'}`} arrow>
            <Chip 
              icon={<EditIcon fontSize="small" />} 
              label="Manually Updated" 
              size="small" 
              color="warning" 
              variant="outlined" 
              sx={{ 
                ml: 1, height: 20, fontSize: '0.65rem',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 249, 196, 0.15)' : '#fff9c4',
              }} 
            />
          </Tooltip>
        )}
      </Box>
      <Tooltip title={`Current value: ${currentValue || 'Empty'} — Click to edit this field`} placement="bottom-start" arrow>
        <TextField
          fullWidth
          size="small"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          sx={{
            backgroundColor: isManuallyUpdated 
              ? (theme.palette.mode === 'dark' ? 'rgba(255, 235, 59, 0.08)' : 'rgba(255, 235, 59, 0.15)') 
              : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
            '& .MuiInputBase-input': {
              color: theme.palette.text.primary,
              fontWeight: 500,
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
            }
          }}
          slotProps={{
            input: {
              readOnly: !isEditing,
            }
          }}
        />
      </Tooltip>
    </Box>
  );
};
