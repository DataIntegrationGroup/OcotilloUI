import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Download, PictureAsPdf } from '@mui/icons-material'

export const ExportDialog = ({
  open,
  onClose,
  onGenerate,
  isGenerating,
  progress,
  rows,
  resolvedCount,
  filename,
  setFilename,
}: {
  open: boolean
  onClose: () => void
  onGenerate: () => Promise<void>
  isGenerating: boolean
  progress: number
  rows: { id: number; name: string }[]
  resolvedCount: number
  filename: string
  setFilename: (value: string) => void
}) => {
  return (
    <Dialog
      open={open}
      onClose={isGenerating ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PictureAsPdf sx={{ fontSize: 18, color: 'secondary.main' }} />
        Batch Export Field Sheets
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', display: 'block', mb: 1 }}
        >
          Export Summary
        </Typography>
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            mb: 2.5,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Typography
          variant="overline"
          sx={{ color: 'primary.main', display: 'block', mb: 1 }}
        >
          File Name Prefix
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          disabled={isGenerating}
          helperText="The batch will be downloaded as a single PDF using this filename."
        />

        {isGenerating && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              Generating PDF file... {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={onGenerate}
          disabled={isGenerating || resolvedCount === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
