import { useState } from 'react'
import {
  useNotification,
  usePermissions,
  useNavigation,
  useList,
} from '@refinedev/core'
import { useParams } from 'react-router-dom'
import { useDataGrid } from '@refinedev/mui'

import { IContact, IWell } from '@/interfaces/ocotillo'
import { WellPDF } from '@/components'
import { buildPdfFilename } from '@/utils'
import { pdf } from '@react-pdf/renderer'

import {
  Button,
  ButtonGroup,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import { ArrowDropDown, Download, Visibility } from '@mui/icons-material'
import { IPdfOptions } from '@/interfaces'

export const WellPDFPreviewButton = ({
  well,
  isLoading,
}: {
  well: IWell
  isLoading: boolean
}) => {
  const { push } = useNavigation()
  const { open: notify } = useNotification()
  const { id } = useParams()
  const { data: permissions, isLoading: isPermissionsLoading } =
    usePermissions<string[]>()

  const {
    dataGridProps: { rows: observations, loading: isObservationsLoading },
  } = useDataGrid({
    resource: 'observation/groundwater-level',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: well?.id },
    },
    queryOptions: {
      cacheTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
    },
  })

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

  const isViewer = permissions?.includes('AMPViewer') ?? false

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [isGenerating, setIsGenerating] = useState(false)

  const disabled =
    isLoading ||
    isPermissionsLoading ||
    !isViewer ||
    isGenerating ||
    isObservationsLoading

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleMenuClose = () => setAnchorEl(null)

  const handlePreview = () => {
    handleMenuClose()
    push(`/ocotillo/well/pdf-preview/${id}`)
  }

  const handleDownload = async (opts: IPdfOptions) => {
    try {
      setIsGenerating(true)
      const filename = buildPdfFilename(well)

      const blob = await pdf(
        <WellPDF
          well={well}
          assets={assets}
          contacts={contacts}
          observations={observations}
          options={opts}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      notify?.({
        message: 'PDF generated successfully',
        type: 'success',
        description: a.download,
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
          '& .MuiButton-root': { textTransform: 'none' },
          '& .MuiButtonGroup-grouped:not(:last-of-type)': {
            borderRight: 'none',
          },
        }}
      >
        <Button
          disabled={disabled}
          startIcon={<Visibility />}
          onClick={handlePreview}
          sx={{ pl: 3, pr: 2 }}
        >
          Preview PDF
        </Button>

        <Tooltip title="more options">
          <Button
            onClick={handleMenuOpen}
            disabled={disabled}
            sx={{ minWidth: 0, px: 1.25 }}
          >
            <ArrowDropDown fontSize="small" />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose()
          }}
          disabled={disabled}
        >
          <ListItemIcon>
            <Download />
          </ListItemIcon>
          <ListItemText>
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
