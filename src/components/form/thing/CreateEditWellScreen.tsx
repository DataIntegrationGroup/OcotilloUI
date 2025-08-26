import { Control, FieldErrors } from 'react-hook-form'
import Grid from '@mui/material/Grid2'
import { ControlledTextField } from '@/components'
import { Button, Typography } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'

interface CreateEditWellScreenProps {
  control: Control<any>
  watch?: any
  setValue?: any
  errors?: FieldErrors<any>
  mode?: 'standalone' | 'step'
  fieldPrefix?: string
  screenIndex?: number
  onRemoveScreen?: (index: number) => void
  onAddScreen?: () => void
  canRemoveScreen?: boolean
  totalScreens?: number
}

export const CreateEditWellScreen: React.FC<CreateEditWellScreenProps> = ({
  control,
  watch,
  setValue,
  errors,
  mode = 'standalone',
  fieldPrefix = '',
  screenIndex,
  onRemoveScreen,
  onAddScreen,
  canRemoveScreen = true,
  totalScreens = 1,
}) => {
  const getFieldName = (fieldName: string) => {
    return mode === 'step' ? `${fieldPrefix}${fieldName}` : fieldName
  }

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={12}>
        <Typography variant="subtitle1" gutterBottom>
          Screen {screenIndex !== undefined ? screenIndex + 1 : ''}
        </Typography>
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Screen Depth Top (ft)"
          control={control}
          name={getFieldName('screen_depth_top')}
          type="number"
          fullWidth
        />
      </Grid>
      
      <Grid size={{ xs: 12, md: 6 }}>
        <ControlledTextField
          label="Screen Depth Bottom (ft)"
          control={control}
          name={getFieldName('screen_depth_bottom')}
          type="number"
          fullWidth
        />
      </Grid>
      
      <Grid size={12}>
        <ControlledTextField
          label="Screen Description"
          control={control}
          name={getFieldName('screen_description')}
          multiline
          minRows={2}
          fullWidth
        />
      </Grid>

      {/* Add/Remove buttons for step mode */}
      {mode === 'step' && (
        <Grid size={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {onAddScreen && (
            <Button
              variant="outlined"
              size="small"
              onClick={onAddScreen}
              startIcon={<Add />}
            >
              Add Another Screen
            </Button>
          )}
          {canRemoveScreen && onRemoveScreen && screenIndex !== undefined && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => onRemoveScreen(screenIndex)}
              startIcon={<Delete />}
            >
              Remove Screen
            </Button>
          )}
        </Grid>
      )}
    </Grid>
  )
}
