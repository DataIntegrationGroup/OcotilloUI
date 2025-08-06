import { Stack, Typography, Box } from '@mui/material'
import { TextFieldComponent as TextField } from '@refinedev/mui'

/**
 * DynamicShowDisplay Component
 * A component to use on the show.tsx pages to dynamically display the fields of a record.
 * 
 * @param record - The record to display
 * @param fieldConfigs - The field configurations for custom field display, field config interface:
 *      label: the label to display for the field
 *      formatter: a function to format the value of the field (optional)
 *      hidden: whether to hide the field (boolean) (optional)
 * 
 * @param excludeFields - The fields to exclude
 * @param autoFormatLabels - Whether to automatically format the labels
 */

//field config interface
interface FieldConfig {
  label: string
  formatter?: (value: any) => string | React.ReactNode
  hidden?: boolean
}

//component props
interface DynamicShowDisplayProps<T> {
  record: T
  fieldConfigs?: Partial<Record<keyof T, FieldConfig>>
  excludeFields?: Array<keyof T>
  autoFormatLabels?: boolean
}

export const DynamicShowDisplay = <T extends Record<string, any>>({
  record,
  fieldConfigs = {},
  excludeFields = [],
  autoFormatLabels = true
}: DynamicShowDisplayProps<T>) => {
  
  const formatLabel = (key: string): string => {
    if (!autoFormatLabels) return key
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
  }

  //handle value for rendering arrays nad objects from json response
  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <Typography variant="body2" color="text.secondary">-</Typography>
    }
    //handle arrays and objects!!
    if (Array.isArray(value) || typeof value === 'object') {
      return (
        <Typography variant="body2" sx={{whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(value, null, 2)}
        </Typography>
      )
    }
    return <Typography variant="body2">{String(value)}</Typography>
  }

  const renderField = (key: string) => {
    if (excludeFields.includes(key as keyof T)) return null
    //get the config for the field if present
    const config = fieldConfigs[key as keyof T]
    if (config?.hidden) return null
    //value of field
    const value = record?.[key]
    //label for the field
    const label = config?.label || formatLabel(key)
    //render the field
    return (
      <Box key={key} sx={{ mb: 2 }}>
        <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
          {label}
        </Typography>
        {config?.formatter ? (
          <TextField value={config.formatter(value) as string} />
        ) : (
          renderValue(value)
        )}
      </Box>
    )
  }

  return (
    <Stack gap={1}>
      {record && Object.keys(record).map((key) => renderField(key))}
    </Stack>
  )
}