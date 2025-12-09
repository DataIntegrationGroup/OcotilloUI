import { Create } from '@refinedev/mui'
import { Typography } from '@mui/material'

export const CategoryCreate: React.FC = () => {
  return (
    <Create
      saveButtonProps={{
        disabled: true,
      }}
    >
      <Typography variant="h1" textAlign="center">
        Lexicon Category are readonly
      </Typography>
    </Create>
  )
}
export const TermCreate: React.FC = () => {
  return (
    <Create
      resource={'lexicon/term'}
      saveButtonProps={{
        disabled: true,
      }}
    >
      <Typography variant="h1" textAlign="center">
        Lexicon Terms are readonly
      </Typography>
    </Create>
  )
}
