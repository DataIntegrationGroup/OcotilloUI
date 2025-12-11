import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import Grid from '@mui/material/Grid2'
import MapComponent from '@/components/MapComponent'
import { Source, Layer } from 'react-map-gl'
import { ErrorBoundary } from 'react-error-boundary'

import wellknown from 'wellknown'
import { Box, Typography } from '@mui/material'

export const GroupShow = () => {
  const { query } = useShow<IGroup>({
    resource: 'ocotillo.group',
  })
  const { data, isLoading } = query
  const record = data?.data as IGroup

  let project_area: any = null

  try {
    if (record?.project_area) {
      project_area = wellknown.parse(record.project_area)
    }
  } catch (e) {
    console.error('Invalid WKT provided:', record.project_area, e)
  }

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show
      isLoading={isLoading}
      title={<Typography variant="h5">{'Show Group / Project'}</Typography>}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ErrorBoundary
            fallback={
              <Box
                sx={(theme) => ({
                  height: '600px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${theme.palette.error.main}`,
                  borderRadius: 3,
                  backgroundColor: `${theme.palette.error.light}66`,
                })}
              >
                <Typography variant="body2" color="error">
                  Failed to load map.
                </Typography>
              </Box>
            }
          >
            <MapComponent
              showDrawControls={{ show: false }}
              style={{ height: '600px', width: '100%' }}
              initialViewState={{
                longitude: -106.4,
                latitude: 34.5,
                zoom: 6,
              }}
            >
              {project_area && (
                <Source key="project-area" type="geojson" data={project_area}>
                  <Layer
                    type="fill"
                    id="project-area-fill"
                    paint={{
                      'fill-color': '#007bff',
                      'fill-opacity': 0.3,
                    }}
                  />
                  <Layer
                    type="fill"
                    id="project-area-fill"
                    paint={{
                      'fill-color': '#007bff',
                      'fill-opacity': 0.3,
                    }}
                  />
                </Source>
              )}
            </MapComponent>
          </ErrorBoundary>
        </Grid>
      </Grid>
    </Show>
  )
}
