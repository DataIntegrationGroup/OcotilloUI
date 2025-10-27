import { useRef, useEffect, useState } from 'react'
import { IWell } from '@/interfaces/ocotillo/IThing'
import { convertLonLatToUTM, parseWktPoint } from '@/utils'
import { Masonry } from '@mui/lab'
import { Box, Card, CardContent, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { HttpError, useList, useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'

export const WellShowPdfPreview = () => {
  const { id } = useParams()
  const {
    queryResult: { data, isLoading },
  } = useShow<IWell, HttpError>({
    resource: 'thing-well',
    id,
  })

  const well = data?.data
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  useEffect(() => {
    if (!previewRef.current) return

    html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
    }).then((canvas) => {
      setPreviewImg(canvas.toDataURL('image/png'))
    })
  }, [well])

  return (
    <Show
      resource="thing-well"
      recordItemId={id}
      isLoading={isLoading}
      title={
        <Typography variant="h5">
          {`Preview Well${well?.name ? `: ${well?.name}` : ''}`}
        </Typography>
      }
    >
      <Card elevation={2}>
        <CardContent>
          {/* This container holds the real DOM that will produce the PDF */}
          <Box
            ref={previewRef}
            sx={{
              width: '800px',
              p: 2,
              bgcolor: 'white',
            }}
          >
            <PDF well={well} />
          </Box>

          {/* Preview canvas result */}
          <Typography variant="h6" gutterBottom>
            PDF Preview
          </Typography>

          {previewImg ? (
            <Box
              component="img"
              src={previewImg}
              alt="PDF Preview"
              sx={{
                width: '100%',
                border: '1px solid #ccc',
                boxShadow: 3,
              }}
            />
          ) : (
            <Typography>Generating preview...</Typography>
          )}
        </CardContent>
      </Card>
    </Show>
  )
}

export const PDF = ({ well }: { well: IWell }) => {
  const coords = parseWktPoint(well?.current_location?.point)
  const [easting, northing] = coords
    ? convertLonLatToUTM(coords.lon, coords.lat)
    : [undefined, undefined]

  const { data } = useList({
    resource: 'asset',
    dataProviderName: 'ocotillo',
    meta: {
      params: { thing_id: well?.id },
    },
  })

  const assets = data?.data ?? []
  debugger

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h1" textAlign="center">
          Field Compilation Notes
        </Typography>
      </Grid>
      <Grid
        size={{ xs: 6 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <LineItem title="Well Id" value={well?.name} />
      </Grid>
      <Grid
        size={{ xs: 6 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <DateBoxes />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem title="Well Id" value={well?.name} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Site Name"
          value={(well as unknown as any)?.site_name}
        />
      </Grid>
      <Grid container size={{ xs: 6 }}>
        <Grid size={{ xs: 6 }}>
          <LineItem title="Easting" value={easting?.toFixed(0)} />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <LineItem title="Northing" value={northing?.toFixed(0)} />
        </Grid>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Location Notes"
          value={well?.current_location?.notes}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Measurement Notes"
          value={(well as unknown as any)?.measurement_notes}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem title="Measuring Point (MP) Height" value={null} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Well Depth"
          value={
            well?.well_depth
              ? `${well?.well_depth} ${well.well_depth_unit}`
              : null
          }
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Last Measured Date"
          value={(well as unknown as any)?.last_measured_date}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LineItem
          title="Last Depth to Water"
          value={(well as unknown as any)?.last_depth_to_water}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            Image Gallery
          </Typography>

          <Masonry columns={3} spacing={2}>
            {assets.map((img: any, idx: number) =>
              img.signed_url ? (
                <Box
                  key={idx}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2,
                  }}
                >
                  <Box
                    component="img"
                    src={img.signed_url}
                    alt={img.name || `Attachment ${idx + 1}`}
                    sx={{
                      width: '100%',
                      display: 'block',
                    }}
                  />
                </Box>
              ) : null
            )}
          </Masonry>
        </Box>
      </Grid>
      {!import.meta.env.PROD ? (
        <Grid size={{ xs: 12 }}>
          <pre>{JSON.stringify(well, null, 2)}</pre>
        </Grid>
      ) : null}
    </Grid>
  )
}

const LineItem = ({
  title,
  value,
}: {
  title: string
  value?: string | number
}) => {
  const safe = (v: React.ReactNode, fallback = 'N/A') =>
    v === null || v === undefined || v === '' ? fallback : v

  return (
    <Box component="div">
      <Typography variant="h6">{`${title}:`}</Typography>
      <Typography variant="body1">{safe(value)}</Typography>
    </Box>
  )
}

const DateBoxes = () => {
  const groups = [
    { count: 4, label: 'Y' },
    { dash: true },
    { count: 2, label: 'M' },
    { dash: true },
    { count: 2, label: 'D' },
  ]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Title */}
      <Typography
        variant="body1"
        sx={{ fontWeight: 700, mb: 0.5, alignSelf: 'center' }}
      >
        Date:
      </Typography>

      {/* Boxes Row */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {groups.map((g, gi) =>
            g.dash ? (
              <Typography
                key={`dash-${gi}`}
                sx={{ fontWeight: 700, fontSize: 20, mx: 0.5 }}
              >
                –
              </Typography>
            ) : (
              // Render a group of boxes
              <Box key={`group-${gi}`} sx={{ display: 'flex', gap: 0.5 }}>
                {Array.from({ length: g.count }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 26,
                      height: 32,
                      border: '2px solid',
                      borderColor: 'grey.600',
                      borderRadius: 0.5,
                    }}
                  />
                ))}
              </Box>
            )
          )}
        </Box>

        {/* Labels Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          {groups.map((g, gi) =>
            g.dash ? (
              // keep spacing under dash for alignment
              <Box key={`dashlbl-${gi}`} sx={{ width: 20 }} />
            ) : (
              <Box
                key={`lbl-${gi}`}
                sx={{
                  display: 'flex',
                  gap: 2.255,
                  ml: 1,
                }}
              >
                {Array.from({ length: g.count }).map((_, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{ fontWeight: 700, letterSpacing: 1, fontSize: 20 }}
                  >
                    {g.label}
                  </Typography>
                ))}
              </Box>
            )
          )}
        </Box>
      </Box>
    </Box>
  )
}
