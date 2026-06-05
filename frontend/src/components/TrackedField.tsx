import { useState, useEffect } from 'react';
import { Box, TextField, Typography, useTheme } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonIcon from '@mui/icons-material/Person';

interface TrackedFieldProps {
  label: string;
  value: string;
  isManuallyUpdated: boolean;
  showIcons?: boolean;
  isEditing?: boolean;
  validate?: (value: string) => string;
  onChange: (newValue: string) => void;
}

export const TrackedField = ({ label, value, isManuallyUpdated, showIcons = true, isEditing = true, validate, onChange }: TrackedFieldProps) => {
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

  const errorMsg = validate ? validate(currentValue) : '';

  return (
    <Box sx={{ mb: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>{label}</Typography>
        
        {showIcons && (
          isManuallyUpdated ? (
            <PersonIcon sx={{ ml: 1, fontSize: 16, color: theme.palette.warning.main }} titleAccess="Manually Updated" />
          ) : (
            <SmartToyOutlinedIcon sx={{ ml: 1, fontSize: 16, color: '#22c55e' }} titleAccess="AI Extracted" />
          )
        )}
      </Box>
      
        <TextField
          fullWidth
          size="small"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={handleBlur}
          error={!!errorMsg}
          helperText={errorMsg}
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
      
    </Box>
  );
};
