import { useState } from 'react'
import {
  useNotification,
  usePermissions,
  useNavigation,
  useList,
} from '@refinedev/core'
import { useParams } from 'react-router-dom'
import { IContact, IWell } from '@/interfaces/ocotillo/IThing'
import {
  Button,
  ButtonGroup,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import { WellPDF } from '@/components'
import { ArrowDropDown, Download, Visibility } from '@mui/icons-material'
import { buildPdfFilename } from '@/utils'
import { pdf } from '@react-pdf/renderer'

export const WellPDFDownloadButton = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  const { push } = useNavigation()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>()

  const { data: assetData } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: well?.id } },
  })

  const { data: contactData } = useList<IContact>({
    resource: 'contact',
    dataProviderName: 'ocotillo',
    meta: { params: { thing_id: well?.id } },
  })

  const assets = assetData?.data ?? []
  const contacts = contactData?.data ?? []

  const { open: notify } = useNotification()
  const { id } = useParams()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const [isGenerating, setIsGenerating] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handlePreview = () => {
    handleMenuClose()
    push(`/ocotillo/well/pdf-preview/${id}`)
  }

  const isViewer = permissions?.includes('AMPViewer') ?? false
  const disabled =
    isLoading || isPermissionsLoading || !isViewer || isGenerating

  const handleDownload = async () => {
    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)

      // Generate a PDF blob from the React PDF component
      const blob = await pdf(
        <WellPDF well={well} assets={assets} contacts={contacts} />
      ).toBlob()

      // Create a temporary download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
      a.click()

      URL.revokeObjectURL(url)

      notify?.({
        message: 'PDF generated successfully',
        type: 'success',
        description: filename,
      })
    } catch (error) {
      console.error(error)
      notify?.({
        message: 'PDF Generation Failed',
        type: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <ButtonGroup
        variant="text"
        color="primary"
        sx={{
          // ensures both buttons share height, style, and no gap
          '& .MuiButton-root': {
            textTransform: 'none',
          },
          // remove default border between buttons
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderRight: 'none',
          },
        }}
      >
        <Button
          disabled={disabled}
          startIcon={<Download />}
          onClick={handleDownload}
          sx={{
            pl: 3,
            pr: 2,
          }}
        >
          {isGenerating ? 'Generating...' : 'Download PDF'}
        </Button>
        <Tooltip title="more options">
          <Button
            onClick={handleMenuOpen}
            disabled={disabled}
            sx={{
              minWidth: 0,
              px: 1.25,
            }}
          >
            <ArrowDropDown fontSize="small" />
          </Button>
        </Tooltip>
      </ButtonGroup>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handlePreview}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>Preview PDF</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
