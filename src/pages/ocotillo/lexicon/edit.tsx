import { Edit } from '@refinedev/mui'
import { Typography } from '@mui/material'

export const CategoryEdit: React.FC = () => {
  return (
    <Edit
      saveButtonProps={{
        disabled: true,
      }}
    >
      <Typography variant="h1" textAlign="center">
        Lexicon Category are readonly
      </Typography>
    </Edit>
  )
}

export const TermEdit: React.FC = () => {
  return (
    <Edit
      saveButtonProps={{
        disabled: true,
      }}
    >
      <Typography variant="h1" textAlign="center">
        Lexicon Terms are readonly
      </Typography>
    </Edit>
  )
}
