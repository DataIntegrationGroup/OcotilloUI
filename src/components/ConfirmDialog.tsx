import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  SecondaryActionBtnMsg?: string
  onSecondaryAction?: () => void
  PrimaryActionBtnMsg?: string
  onPrimaryAction?: () => void
}

export const ConfirmDialog = ({
  open,
  onClose,
  SecondaryActionBtnMsg = 'Cancel',
  onSecondaryAction = onClose,
  PrimaryActionBtnMsg = 'Continue',
  onPrimaryAction,
  title = '',
  text = '',
}: { title: string; text: string } & ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px 24px',
        }}
      >
        <Button onClick={onSecondaryAction} variant="outlined">
          {SecondaryActionBtnMsg}
        </Button>
        <Button onClick={onPrimaryAction} variant="contained" color="primary">
          {PrimaryActionBtnMsg}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
