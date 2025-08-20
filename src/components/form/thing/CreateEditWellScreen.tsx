import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'

export const CreateEditWellScreen = ({
  control,
  register,
  errors,
  setValue,
  mode,
}) => {
  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={12}>
        <TextField
          {...register('screen_depth_bottom')}
          error={!!errors.screen_depth_bottom}
          helperText={errors.screen_depth_bottom?.message}
          margin="normal"
          fullWidth
          label="Screen Depth Bottom"
        />
      </Grid>
      <Grid size={12}>
        <TextField
          {...register('screen_depth_top')}
          error={!!errors.screen_depth_top}
          helperText={errors.screen_depth_top?.message}
          margin="normal"
          fullWidth
          label="Screen Depth top"
        />
      </Grid>
      <Grid size={12}>
        <TextField
          {...register('screen_description')}
          error={!!errors.screen_description}
          helperText={errors.screen_description?.message}
          margin="normal"
          fullWidth
          label="Description"
        />
      </Grid>
    </Grid>
  )
}
