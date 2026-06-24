import { MenuItem, Select, FormControl, InputLabel, Box } from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { DebouncedTextInput } from '@/components/DebouncedTextInput'

type FilterComponentProps = {
  field: string
  setField: (value: string) => void
  operator: string
  setOperator: (value: string) => void
  value: string
  setValue: (value: string) => void
}

export const FilterComponent = ({
  field,
  setField,
  operator,
  setOperator,
  value,
  setValue,
}: FilterComponentProps) => {
  const handleFieldChange = (event: SelectChangeEvent<string>) => {
    setField(event.target.value as string)
  }

  const handleOperatorChange = (event: SelectChangeEvent<string>) => {
    setOperator(event.target.value as string)
  }

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <FormControl variant="outlined" sx={{ minWidth: 120 }}>
        <InputLabel id="field-label">Field</InputLabel>
        <Select
          variant={'outlined'}
          labelId="field-label"
          value={field}
          onChange={handleFieldChange}
          label="Field"
        >
          <MenuItem value="WellDepth">Well Depth</MenuItem>
          <MenuItem value="HoleDepth">Hole Depth</MenuItem>
        </Select>
      </FormControl>

      <FormControl variant="outlined" sx={{ minWidth: 120 }}>
        <InputLabel id="operator-label">Operator</InputLabel>
        <Select
          variant={'outlined'}
          labelId="operator-label"
          value={operator}
          onChange={handleOperatorChange}
          label="Operator"
        >
          <MenuItem value="equal">{'equal'}</MenuItem>
          <MenuItem value="lessThan">{'lessThan'}</MenuItem>
          <MenuItem value="greaterThan">{'greaterThan'}</MenuItem>
        </Select>
      </FormControl>

      <DebouncedTextInput value={value} setValue={setValue} />
    </Box>
  )
}

export default FilterComponent
