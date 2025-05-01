import { Dispatch, SetStateAction } from 'react'
import { CloudUpload } from '@mui/icons-material'
import { Button, Chip } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { VisuallyHiddenTextField } from './VisuallyHiddenTextField'

export const AddPhotosSection = ({
  selectedFiles,
  setSelectedFiles,
}: {
  selectedFiles: File[]
  setSelectedFiles: Dispatch<SetStateAction<File[]>>
}) => {
  const handleDeleteFile = (fileToDelete: File) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToDelete)
    )
  }

  const handlePhotoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files

    if (!files) return

    setSelectedFiles((prevFiles) => [...prevFiles, ...Array.from(files)])
    event.target.value = ''
  }

  return (
    <Grid
      container
      size={12}
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={2}
      sx={{ paddingTop: '3rem', paddingBottom: '1rem' }}
    >
      <Grid
        container
        spacing={1}
        justifyContent="center"
        sx={{ marginBottom: '1rem' }}
      >
        {selectedFiles?.map((file, index) => (
          <Chip
            key={index}
            label={`${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
            onDelete={() => handleDeleteFile(file)}
            color="secondary"
          />
        ))}
      </Grid>
      <Grid container spacing={1} size={12} justifyContent="center">
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUpload />}
        >
          Upload Well Photos
          <VisuallyHiddenTextField
            type="file"
            onChange={handlePhotoFileChange}
            multiple
            accept="image/jpeg, image/png, image/heic"
          />
        </Button>
      </Grid>
    </Grid>
  )
}
