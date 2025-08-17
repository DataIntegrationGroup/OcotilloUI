import { useShow } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { DynamicShowDisplay } from '@/components/DynamicShowDisplay'
import { IGroup } from '@/interfaces/ocotillo/IGroup'
import Grid from '@mui/material/Grid2'
import MapComponent from '@/components/MapComponent'
import { Source, Layer } from 'react-map-gl'
import wellknown from 'wellknown'

export const GroupShow = () => {
  const { query } = useShow<IGroup>({
    resource: 'ocotillo.group',
  })
  const { data, isLoading } = query
  const record = data?.data as IGroup

  let project_area = null
  if (record?.project_area) {
    project_area = wellknown.parse(record.project_area)
  }

  const fieldConfigs = {
    created_at: {
      label: 'Created At',
      formatter: (value: string) =>
        value ? new Date(value).toLocaleString() : '',
    },
  }

  return (
    <Show isLoading={isLoading}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <MapComponent
            showDrawControls={{ show: false }}
            style={{ height: '600px', width: '100%' }}
            initialViewState={{
              longitude: -106.4,
              latitude: 34.5,
              zoom: 6,
            }}
          >
            <Source key={'project-area'} type="geojson" data={project_area}>
              <Layer
                type="fill"
                id="project-area-fill"
                paint={{
                  'fill-color': '#007bff',
                  'fill-opacity': 0.3,
                }}
              />
            </Source>
          </MapComponent>
        </Grid>
        <Grid size={12}>
          <DynamicShowDisplay record={record} fieldConfigs={fieldConfigs} />
        </Grid>
      </Grid>
    </Show>
  )
}
