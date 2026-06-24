import { Controller, Control, FieldValues, Path } from 'react-hook-form'
import { Box, FormControl } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const MOUNTAIN_TZ = 'America/Denver'

export const ControlledDateField = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  showAsterisk = false,
  ...pickerProps
}: {
  control: Control<T>
  name: string
  label: string
  required?: boolean
  showAsterisk?: boolean
} & any) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
          <DateTimePicker
            label={
              <>
                {label}
                {showAsterisk ? (
                  <>
                    {' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      *
                    </Box>
                  </>
                ) : null}
              </>
            }
            timezone={MOUNTAIN_TZ}
            value={field.value ? dayjs(field.value as string) : null}
            onChange={(date) => {
              //will send date in UTC format
              field.onChange(date ? date.toISOString() : null)
            }}
            slotProps={{
              textField: {
                required,
                error: !!fieldState.error,
                helperText: fieldState?.error?.message,
              },
            }}
            {...pickerProps}
          />
        </FormControl>
      )}
    />
  )
}
