import { Stack, Typography } from '@mui/material'
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
  formatter?: (value: any) => string
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

  const renderField = (key: string) => {
    if (excludeFields.includes(key as keyof T)) return null
    
    const config = fieldConfigs[key as keyof T]
    if (config?.hidden) return null
    
    const value = record?.[key]
    const label = config?.label || formatLabel(key)
    const formattedValue = config?.formatter ? config.formatter(value) : value
    
    return (
      <div key={key}>
        <Typography variant="body1" fontWeight="bold">
          {label}
        </Typography>
        <TextField value={formattedValue || ''} />
      </div>
    )
  }

  return (
    <Stack gap={1}>
      {record && Object.keys(record).map((key) => renderField(key))}
    </Stack>
  )
}