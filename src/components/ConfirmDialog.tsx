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
  onConfirm: () => void
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = '',
  text = '',
}: { title: string; text: string } & ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
