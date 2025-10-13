import { Select, MenuItem } from '@mui/material'

export const BaseMapSelect = ({ baseMap, setBaseMap }) => {
  return (
    <Select
      value={baseMap}
      onChange={(event) => setBaseMap(event.target.value)}
    >
      <MenuItem value="dark-v11">Dark</MenuItem>
      <MenuItem value="light-v11">Light</MenuItem>
      <MenuItem value="satellite-streets-v12">Satellite-Streets</MenuItem>
      <MenuItem value="streets-v12">Streets</MenuItem>
      <MenuItem value="outdoors-v12">Outdoors</MenuItem>
      <MenuItem value="satellite-v9">Satellite</MenuItem>
      <MenuItem value="basic-v9">Basic</MenuItem>
      <MenuItem value="bright-v9">Bright</MenuItem>
      <MenuItem value="neon">Neon</MenuItem>
    </Select>
  )
}
