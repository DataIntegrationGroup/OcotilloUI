import { useEffect, useState, useMemo } from 'react'
import { EditButton, useDataGrid } from '@refinedev/mui'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type {
  IDatastream,
  IHydrographDatasource,
  IHydrographOptions,
  ISensor,
} from '@/interfaces/st2'
import { ListPage } from '@/components/ListPage'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  InputLabel,
} from '@mui/material'
import { useAll } from '@/useAll'
import { settings } from '@/settings'
import { ST2Hydrograph } from '@/components/Hydrographs/Hydrograph'
import { ClearableSelect } from '@/components/ClearableSelect'
import Stack from '@mui/material/Stack'
import { DebouncedTextInput } from '@/components/DebouncedTextInput'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { Dayjs } from 'dayjs'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useSelect } from '@refinedev/core'

const Agencies = ['BernCo', 'PVACD', 'EBID', 'CABQ']
const DatastreamKinds = [
  'Manual Groundwater Levels',
  'Groundwater Levels',
  'Groundwater Elevations',
]

export const ST2DatastreamList = () => {
  const [datastreamIds, setDatastreamIds] = useState<number[]>([])
  const [activeDatastreamId, setActiveDatastreamId] = useState<number>()
  const [rows, setRows] = useState<IDatastream[]>([])
  const [datasource, setDataSource] = useState<IHydrographDatasource[]>([])
  const [agency, setAgency] = useState<string>('BernCo')
  const [datastreamKind, setDatastreamKind] =
    useState<string>('Groundwater Levels')
  const [filterLocationName, setFilterLocationName] = useState<string>('')
  const [sensorKind, setSensorKind] = useState<string>('VuLink')
  const [minDate, setMinDate] = useState<Dayjs | null>(null)
  const [maxDate, setMaxDate] = useState<Dayjs | null>(null)
  const [refreshHydrograph, setRefreshHydrograph] = useState(0)
  const [hydrographOptions, setHydrographOptions] =
    useState<IHydrographOptions>({
      useNormalization: false,
      useCompact: true,
      dataZoom: undefined,
    })

  const { options: sensorKinds } = useSelect<ISensor>({
    resource: 'Sensors',
    dataProviderName: 'st2',
    optionLabel: 'name',
    optionValue: 'name',
  })

  const getObservationFilter = () => {
    let fs = []
    if (minDate) {
      fs.push(`phenomenonTime gt ${minDate.toISOString()}`)
    }
    if (maxDate) {
      fs.push(`phenomenonTime lt ${maxDate.toISOString()}`)
    }
    return fs.join(' and ')
  }

  const { isLoading, triggerAll } = useAll({
    resource: `Datastreams(${activeDatastreamId})/Observations`,
    meta: {
      filter: getObservationFilter(),
      orderby: 'resultTime asc',
    },
    dataProviderName: 'st2',
  })

  const getFilter = () => {
    let fs = [
      `name ne 'OSERealTime Discharge'`,
      `name ne 'OSERealTime Gage Height'`,
    ]
    if (agency) {
      fs.push(`Thing/properties/agency eq '${agency}'`)
    }
    if (datastreamKind) {
      fs.push(`name eq '${datastreamKind}'`)
    }
    if (filterLocationName) {
      fs.push(`startswith(Thing/Locations/name, '${filterLocationName}')`)
    }
    if (sensorKind) {
      fs.push(`Sensor/name eq '${sensorKind}'`)
    }
    return fs.join(' and ')
  }

  const { dataGridProps } = useDataGrid<IDatastream>({
    resource: 'Datastreams',
    dataProviderName: 'st2',
    meta: {
      expand: 'Thing/Locations, Sensor',
      filter: getFilter(),
      orderby: 'id asc',
    },
  })

  useEffect(() => {
    setRows([...dataGridProps.rows])
  }, [dataGridProps.rows])

  const columns = useMemo<GridColDef<IDatastream>[]>(
    () => [
      { field: '@iot.id', headerName: 'ID', type: 'string', minWidth: 75 },
      { field: 'name', headerName: 'name', type: 'string', minWidth: 200 },
      {
        field: 'unitOfMeasurement',
        headerName: 'Unit',
        valueGetter: (value, row) => row.unitOfMeasurement?.symbol,
        minWidth: 25,
      },
      {
        field: 'agency',
        headerName: 'Agency',
        valueGetter: (value, row) => row.Thing?.properties?.agency,
        minWidth: 150,
      },
      {
        field: 'Location',
        headerName: 'Location',
        valueGetter: (value, row) =>
          row.Thing?.Locations?.map((loc) => loc.name).join(', '),
        minWidth: 300,
      },
      {
        field: 'sensor',
        headerName: 'Sensor',
        valueGetter: (value, row) => row.Sensor?.name,
      },
      {
        field: 'locationID',
        headerName: 'Location ID',
        renderCell: function render({ row }) {
          const locationId = row.Thing.Locations[0]['@iot.id']
          return (
            <div>
              <a href={`${settings.st2_url}/Locations(${locationId})`}>
                {locationId}
              </a>
            </div>
          )
        },

        minWidth: 150,
      },
      {
        field: 'ThingID',
        headerName: 'Thing ID',
        renderCell: function render({ row }) {
          const thingId = row.Thing['@iot.id']
          return (
            <div>
              <a href={`${settings.st2_url}/Things(${thingId})`}>{thingId}</a>
            </div>
          )
        },
        // valueGetter: params => params.row.Thing?.['@iot.id'], minWidth: 150
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: function render({ row }) {
          return (
            <div>
              <EditButton hideText recordItemId={row['@iot.id']} />
              {/*<ShowButton hideText recordItemId={row['@iot.id']}/>*/}
            </div>
          )
        },
        align: 'center',
        headerAlign: 'center',
        minWidth: 80,
        flex: 0.3,
      },
    ],
    []
  )

  const handleSelectionChange = (selectionModel: any) => {
    const selectedRow = rows.find((row) => {
      return row['@iot.id'] === selectionModel.at(-1)
    })
    if (!selectedRow) {
      setDataSource([])
      setRefreshHydrograph((prev) => prev + 1)
      return
    }

    setDatastreamIds(selectionModel)
    setActiveDatastreamId(selectionModel.at(-1))
  }

  const wrapper = async () => {
    const ps = datastreamIds.map((dsid) => {
      // get row
      const row = rows.find((row) => {
        return row['@iot.id'] === dsid
      })

      const nobs = datasource.filter((o) => datastreamIds.includes(o.id))
      const ids = nobs.map((o) => o.id)

      if (ids.includes(dsid)) {
        // may need data refreshed
        return datasource.find((d) => d.id === dsid)
      } else {
        return triggerAll().then((data) => {
          return {
            id: dsid,
            name: row.Thing?.Locations?.map((loc) => loc.name).join(', '),
            data: data,
          }
        })
      }
    })
    const sources = await Promise.all(ps)
    setDataSource(sources)
    setRefreshHydrograph((prev) => prev + 1)
  }

  useEffect(() => {
    wrapper().then()
  }, [activeDatastreamId, datastreamIds, minDate, maxDate])

  // const findDuplicates = async () => {
  //     const updatedRows = rows.map(async (row) => {
  //         // row.Sensor.name = 'asdfs';
  //         console.log('row', row['@iot.id']);
  //
  //         const data = await triggerAll({resource: `Datastreams(${row['@iot.id']})/Observations`});
  //         console.log('hydrograph data', row['@iot.id'], data);
  //         if (data.length == 0) {
  //             row.name = `${row.name} (Duplicate)`;
  //         }
  //
  //         return row;
  //     });
  //
  //
  //     setRows(await Promise.all(updatedRows));
  // };

  return (
    <>
      <ListPage
        getRowId={(row) => row['@iot.id']}
        columns={columns}
        dataGridProps={{
          ...dataGridProps,
          rows,
          ...{ checkboxSelection: true },
        }}
        onSelectionChange={handleSelectionChange}
        isLoading={isLoading}
      >
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <InputLabel>Hydrograph</InputLabel>
          </AccordionSummary>
          <AccordionDetails>
            <Card sx={{ padding: 2, margin: 1 }}>
              <ST2Hydrograph
                // name={locationName}
                options={hydrographOptions}
                refresh={refreshHydrograph}
                datasource={datasource}
              />
            </Card>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <InputLabel>Observations</InputLabel>
          </AccordionSummary>
          <AccordionDetails>
            <Card sx={{ padding: 2, margin: 1 }}>
              <DataGrid
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                rowHeight={settings.rowHeight}
                rows={datasource
                  .map((d) => {
                    return d.data.map((obs) => {
                      return { ...obs, id: obs['@iot.id'], location: d.name }
                    })
                  })
                  .flat()}
                columns={[
                  // {field: 'resultTime', headerName: 'resultTime', type: 'dateTime', width: 200},
                  {
                    field: 'location',
                    headerName: 'Location',
                    minWidth: 200,
                  },
                  // {
                  //     field: 'id', headerName: 'ID',
                  //     type: 'number', width: 120,
                  //     valueFormatter: (params) => {
                  //         return params.id.toString().replace(/,/g, '');
                  //     }
                  // },
                  {
                    field: 'phenomenonTime',
                    headerName: 'Measurement Date Time',
                    type: 'dateTime',
                    width: 200,
                    valueGetter: (value) => {
                      return new Date(value)
                    },
                  },
                  {
                    field: 'result',
                    headerName: 'Depth To Water BGS (ft)',
                    type: 'number',
                    width: 200,
                  },
                ]}
              />
            </Card>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <InputLabel>Filter</InputLabel>
          </AccordionSummary>
          <AccordionDetails>
            <Card sx={{ padding: 2, margin: 1 }}>
              <Stack direction={'row'}>
                <DebouncedTextInput
                  value={filterLocationName}
                  setValue={setFilterLocationName}
                  delay={1000}
                  options={{
                    label: 'Location',
                    style: { width: '60%' },
                  }}
                />
                <ClearableSelect
                  label={'Agency'}
                  value={agency}
                  setValue={setAgency}
                  values={Agencies}
                />
                <ClearableSelect
                  label={'Datastream Kind'}
                  value={datastreamKind}
                  setValue={setDatastreamKind}
                  values={DatastreamKinds}
                />
                <ClearableSelect
                  label={'Sensor Kind'}
                  setValue={setSensorKind}
                  value={sensorKind}
                  values={sensorKinds.map((options) => options.value)}
                />
              </Stack>
              <Stack direction={'row'} sx={{ pt: 2 }}>
                <DatePicker
                  label={'Min. Date'}
                  value={minDate}
                  onChange={(newValue) => setMinDate(newValue)}
                />
                <DatePicker
                  label={'Max. Date'}
                  value={maxDate}
                  onChange={(newValue) => setMaxDate(newValue)}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hydrographOptions.useNormalization}
                      onChange={(v) =>
                        setHydrographOptions({
                          ...hydrographOptions,
                          useCompact: false,
                          useNormalization: v.target.checked,
                        })
                      }
                    />
                  }
                  label="Use Normalization"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hydrographOptions.useCompact}
                      onChange={(v) =>
                        setHydrographOptions({
                          ...hydrographOptions,
                          useNormalization: false,
                          useCompact: v.target.checked,
                        })
                      }
                    />
                  }
                  label="Use Compact"
                />
                <ClearableSelect
                  label={'Data Zoom'}
                  value={hydrographOptions.dataZoom}
                  onClear={() =>
                    setHydrographOptions({
                      ...hydrographOptions,
                      dataZoom: undefined,
                    })
                  }
                  setValue={(v) =>
                    setHydrographOptions({
                      ...hydrographOptions,
                      dataZoom: v,
                    })
                  }
                  values={['earliest', 'latest']}
                />
              </Stack>
            </Card>
          </AccordionDetails>
        </Accordion>
      </ListPage>
    </>
  )
}
