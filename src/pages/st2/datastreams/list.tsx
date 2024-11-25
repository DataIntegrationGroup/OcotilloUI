// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================
import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React, {useEffect, useState} from "react";
import {DataGrid, type GridColDef} from "@mui/x-data-grid";
import type {IDatastream, IHydrographDatasource, IHydrographOptions, IObservation} from "@/interfaces/st2";
import {ListPage} from "@/components/ListPage";
import {Button, Card, InputLabel, TextField} from "@mui/material";
import {useAll} from "@/useAll";
// import Chart from "@/components/Chart";
import {settings} from "@/settings";
import ReactECharts from "echarts-for-react";
import {ST2Hydrograph} from "@/components/Hydrograph";
import {ClearableSelect} from "@/components/ClearableSelect";
import Stack from "@mui/material/Stack";
import {DebouncedTextInput} from "@/components/DebouncedTextInput";
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {Dayjs} from 'dayjs';
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

const Agencies = ['BernCo', 'PVACD', 'EBID', 'CABQ']
const DatastreamKinds = ['Manual Groundwater Levels', 'Groundwater Levels', 'Groundwater Elevations']
const SensorKinds = ['Manual', 'RadioTower', 'VuLink']

export const ST2DatastreamList: React.FC = () => {
    const [datastreamIds, setDatastreamIds] = useState<number[]>([]);
    const [activeDatastreamId, setActiveDatastreamId] = useState<number>();
    const [rows, setRows] = useState<IDatastream[]>([]);
    const [datasource, setDataSource] = useState<IHydrographDatasource[]>([])
    // const [locationName, setSelectedLocationName] = useState<string>('')
    const [agency, setAgency] = useState<string>('BernCo')
    const [datastreamKind, setDatastreamKind] = useState<string>('Groundwater Levels')
    const [filterLocationName, setFilterLocationName] = useState<string>('')
    const [sensorKind, setSensorKind] = useState<string>('VuLink')
    const [minDate, setMinDate] = useState<Dayjs | null>(null)
    const [maxDate, setMaxDate] = useState<Dayjs | null>(null)
    const [refreshHydrograph, setRefreshHydrograph] = useState(0)
    const [hydrographOptions, setHydrographOptions] = useState<IHydrographOptions>({
        useNormalization: false,
        useCompact: true,
        dataZoom: '',
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

    const {isLoading, triggerAll} = useAll({
        resource: `Datastreams(${activeDatastreamId})/Observations`,
        meta: {
            filter: getObservationFilter(),
            orderby: 'resultTime asc'
        },
        dataProviderName: 'st2',
    });

    const getFilter = () => {
        let fs = [`name ne 'OSERealTime Discharge'`, `name ne 'OSERealTime Gage Height'`]
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

    const {dataGridProps} = useDataGrid<IDatastream>({
        resource: "Datastreams",
        dataProviderName: "st2",
        meta: {
            'expand': 'Thing/Locations, Sensor',
            'filter': getFilter(),
            'orderby': 'id asc'
        },
    });

    useEffect(() => {
        setRows([...dataGridProps.rows]);
    }, [dataGridProps.rows]);

    const columns = React.useMemo<GridColDef<IDatastream>[]>(
        () => [
            {field: "@iot.id", headerName: "ID", type: "string", minWidth: 75},
            {field: "name", headerName: "name", type: "string", minWidth: 200},
            {
                field: "unitOfMeasurement",
                headerName: "Unit",
                valueGetter: params => params.row.unitOfMeasurement?.symbol,
                minWidth: 25
            },
            {
                field: "agency",
                headerName: "Agency",
                valueGetter: params => params.row.Thing?.properties?.agency,
                minWidth: 150
            },
            {
                field: "Location",
                headerName: "Location",
                valueGetter: params => params.row.Thing?.Locations?.map((loc) => loc.name).join(', '),
                minWidth: 300
            },
            {field: "sensor", headerName: "Sensor", valueGetter: params => params.row.Sensor?.name},
            {
                field: "locationID", headerName: "Location ID",
                renderCell: function render({row}) {
                    const locationId = row.Thing.Locations[0]['@iot.id']
                    return (<div>
                        <a
                            href={`${settings.st2_url}/Locations(${locationId})`}
                        >{locationId}</a>
                    </div>)
                },

                minWidth: 150
            },
            {
                field: "ThingID", headerName: "Thing ID",
                renderCell: function render({row}) {
                    const thingId = row.Thing['@iot.id']
                    return (<div>
                        <a href={`${settings.st2_url}/Things(${thingId})`}>{thingId}</a>
                    </div>)
                }
                // valueGetter: params => params.row.Thing?.['@iot.id'], minWidth: 150
            },
            {
                field: "actions",
                headerName: "Actions",
                renderCell: function render({row}) {
                    return (
                        <div>
                            <EditButton hideText recordItemId={row['@iot.id']}/>
                            {/*<ShowButton hideText recordItemId={row['@iot.id']}/>*/}
                        </div>
                    );
                },
                align: "center",
                headerAlign: "center",
                minWidth: 80,
                flex: 0.3,
            },
        ],
        []
    );

    const handleSelectionChange = (selectionModel: any) => {
        const selectedRow = rows.find((row) => {
            return row["@iot.id"] === selectionModel.at(-1)
        })
        if (!selectedRow) {
            setDataSource([])
            setRefreshHydrograph((prev) => prev + 1)
            return;
        }

        setDatastreamIds(selectionModel);
        setActiveDatastreamId(selectionModel.at(-1))
    };

    useEffect(() => {
        const nobs = datasource.filter((o) => datastreamIds.includes(o.id));
        const ids = nobs.map((o) => o.id)

        const wrapper = async () => {
            const f = (dsid) => {
                // get row
                const row = rows.find((row) => {
                    return row['@iot.id'] === dsid
                })

                if (ids.includes(dsid)) {
                    // may need data refreshed
                    return datasource.find((d) => d.id === dsid)
                } else {
                    return triggerAll().then((data) => {
                        return {
                            id: dsid,
                            name: row.Thing?.Locations?.map((loc) => loc.name).join(', '),
                            data: data
                        }
                    })
                }
            }
            const ps = datastreamIds.map(f)
            const sources = await Promise.all(ps)
            setDataSource(sources)
            setRefreshHydrograph((prev) => prev + 1)
        }

        wrapper()

        // if (datastreamIds.length===0) return;
        // remove datastreams from observations that are not in datastreamIds
        // console.log('ff',datasource)
        // console.log('aa',datastreamIds)
        // const nobs = datasource.filter((o)=> datastreamIds.includes(o.id));
        // console.log('nobas', nobs)
        //
        // const row = rows.find((row)=>{return row['@iot.id'] === activeDatastreamId})
        // // if activeDatastreamId already in obs dont load
        // if (datasource.map((o)=>{return o.id}).includes(activeDatastreamId)) {
        //     console.log('setObasd', nobs)
        //     setDataSource(nobs)
        //     setRefreshHydrograph((prev)=>prev+1)
        // } else {
        //     triggerAll(
        //     ).then(
        //         (data) => {
        //             console.log('hydrograph data', data);
        //             setDataSource((prev)=>{return [...prev, ...[{id: activeDatastreamId,
        //                                                         name: row.Thing?.Locations?.map((loc) => loc.name).join(', '),
        //                                                         data: data}]]})
        //         }
        //     );
        // }
        //
    }, [activeDatastreamId, datastreamIds, minDate, maxDate]);

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
                getRowId={(row) => row["@iot.id"]}
                columns={columns}
                dataGridProps={{...dataGridProps, rows, ...{checkboxSelection: true}}}
                onSelectionChange={handleSelectionChange}
                isLoading={isLoading}
            >
                <Card sx={{padding: 2, margin: 1}}>
                    <ST2Hydrograph
                        // name={locationName}
                        options={hydrographOptions}
                        refresh={refreshHydrograph}
                        datasource={datasource}/>
                </Card>
                <Card sx={{padding: 2, margin: 1}}>
                    <Stack direction={'row'}>
                        <DebouncedTextInput
                            value={filterLocationName}
                            setValue={setFilterLocationName}
                            delay={1000}
                            options={{
                                label: 'Location',
                                style: {width: '60%'}
                            }}
                        />
                        <ClearableSelect label={'Agency'}
                                         value={agency} setValue={setAgency} values={Agencies}/>
                        <ClearableSelect label={'Datastream Kind'}
                                         value={datastreamKind} setValue={setDatastreamKind} values={DatastreamKinds}/>
                        <ClearableSelect label={'Sensor Kind'}
                                         setValue={setSensorKind}
                                         value={sensorKind}
                                         values={SensorKinds}/>
                    </Stack>
                    <Stack direction={'row'} sx={{pt: 2}}>
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
                        <FormControlLabel control={
                            <Checkbox checked={hydrographOptions.useNormalization}
                                      onChange={(v) => setHydrographOptions({...hydrographOptions,
                                          useCompact: false,
                                          useNormalization: v.target.checked})}/>}
                                          label="Use Normalization"/>
                        <FormControlLabel control={
                            <Checkbox checked={hydrographOptions.useCompact}
                                      onChange={(v) => setHydrographOptions({...hydrographOptions,
                                          useNormalization: false,
                                          useCompact: v.target.checked})}/>}
                                          label="Use Compact"/>
                        <ClearableSelect label={'Data Zoom'}
                                            value={hydrographOptions.dataZoom}
                                            onClear={() => setHydrographOptions({...hydrographOptions, dataZoom: ''})}
                                            setValue={(v) => setHydrographOptions({...hydrographOptions, dataZoom: v})}
                                            values={['earliest', 'latest']}/>


                    </Stack>

                </Card>
            </ListPage>
        </>
    );
};
// ============= EOF =============================================
