import { useMemo } from 'react'
import { useDataGrid } from '@refinedev/mui'
import { GridColDef } from '@mui/x-data-grid'
import { Box } from '@mui/material'
import { Launch } from '@mui/icons-material'
import { IThingIdLink } from '@/interfaces/ocotillo'
import { actionColumnDef, idColumnDef } from '@/components/CommonColumnDefs'
import { ExternalLink, ListPage } from '@/components'

export const ThingIdLinkList = () => {
  const { dataGridProps } = useDataGrid({
    resource: 'thing/id-link',
    dataProviderName: 'ocotillo',
  })

  const columns = useMemo<GridColDef<IThingIdLink>[]>(
    () => [
      idColumnDef(),
      {
        field: 'thing_id',
        headerName: 'Thing ID',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'relation',
        headerName: 'Relationship',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'alternate_id',
        headerName: 'Alternate ID',
        type: 'string',
        minWidth: 150,
        renderCell: (params) => {
          const val = params.value

          // Always be safe: if it's null/undefined, render empty
          if (val == null) return ''

          // Ensure it's a string for operations like split
          const s = String(val)

          if (params.row.alternate_organization === 'USGS') {
            return (
              <ExternalLink
                href={`https://waterdata.usgs.gov/nwis/uv?site_no=${s}`}
              >
                {s}
              </ExternalLink>
            )
          }

          if (params.row.relation === 'OSEPOD') {
            // Only split if it actually contains "-"
            const [basin, nbr] = s.split('-')
            if (!basin || !nbr) return s

            return (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <ExternalLink
                  href={`https://services2.arcgis.com/qXZbWTdPDbTjl7Dy/arcgis/rest/services/OSE_PODs/FeatureServer/0/query?where=+db_file%3D%27${encodeURIComponent(
                    s
                  )}%27&f=pjson&outFields=*`}
                  showIcon={false}
                >
                  {s}
                </ExternalLink>
                <ExternalLink
                  href={`https://nmwrrs.ose.nm.gov/ReportDispatcher?type=WRHTML&name=WaterRightSummaryHTML.jrxml&basin=${encodeURIComponent(
                    basin
                  )}&nbr=${encodeURIComponent(nbr)}&suffix=`}
                  showIcon={false}
                >
                  <Launch />
                </ExternalLink>
              </Box>
            )
          }
          return s
        },
      },
      {
        field: 'alternate_organization',
        headerName: 'Alternate Organization',
        type: 'string',
        minWidth: 150,
      },
      {
        field: 'created_at',
        headerName: 'Created At',
        type: 'dateTime',
        minWidth: 180,
        valueGetter: (params) => (params ? new Date(params) : null),
      },
      actionColumnDef(),
    ],
    []
  )

  const DESCRIPTION = `
    Thing ID Links are used to associate a Thing with identifiers from
    external systems or organizations. 
    These links make it possible to reference the same Thing using
    alternate identifiers such as OSE POD numbers or USGS site IDs,
    while preserving a single canonical Thing record in the system.
    `

  return (
    <ListPage
      title={'Alternative ID Links'}
      getRowId={(row) => row.id}
      columns={columns}
      dataGridProps={dataGridProps}
      description={DESCRIPTION}
    />
  )
}
