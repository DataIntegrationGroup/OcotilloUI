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
import { ShowButton, EditButton, List, useDataGrid } from "@refinedev/mui";
import React, { useEffect, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { IDatastream, IObservation } from "@/interfaces/st2";
import { ListPage } from "@/components/ListPage";
import {Button, Card, TextField} from "@mui/material";
import { useAll } from "@/useAll";
// import Chart from "@/components/Chart";
import {settings} from "@/settings";
import ReactECharts from "echarts-for-react";
import {ST2Hydrograph} from "@/components/Hydrograph";
import {ClearableSelect} from "@/components/ClearableSelect";
import Stack from "@mui/material/Stack";
import {DebouncedTextInput} from "@/components/DebouncedTextInput";


const Agencies = ['BernCo', 'PVACD', 'EBID']
const DatastreamKinds = ['Manual Groundwater Levels', 'Groundwater Levels']
const SensorKinds = ['Manual', 'RadioTower', 'VuLink']

export const ST2DatastreamList: React.FC = () => {
    const [datastreamId, setDatastreamId] = useState<BigInteger | null>(null);
    const [rows, setRows] = useState<IDatastream[]>([]);
    const [observations, setObservations] = useState<IObservation[]>([])
    const [locationName, setSelectedLocationName] = useState<string>('')
    const [agency, setAgency] = useState<string>('')
    const [datastreamKind, setDatastreamKind] = useState<string>('')
    const [filterLocationName, setFilterLocationName]= useState<string>('')
    const [sensorKind, setSensorKind] = useState<string>('')

    const { isLoading, triggerAll } = useAll({
        resource: `Datastreams(${datastreamId})/Observations`,
        dataProviderName: 'st2',
    });

    const getFilter = ()=>{
        let fs = []
        if (agency){
            fs.push(`Thing/properties/agency eq '${agency}'`)
        }
        if (datastreamKind){
            fs.push(`name eq '${datastreamKind}'`)
        }
        if (filterLocationName){
            fs.push(`startswith(Thing/Locations/name, '${filterLocationName}')`)
        }
        if (sensorKind){
            fs.push(`Sensor/name eq '${sensorKind}'`)
        }
        return fs.join(' and ')
    }

    const { dataGridProps } = useDataGrid<IDatastream>({
        resource: "Datastreams",
        dataProviderName: "st2",
        meta: {
            'expand': 'Thing/Locations, Sensor',
            'filter': getFilter(),
            'orderby': 'id asc'
            // 'orderby': 'Thing/Locations/name asc'
        }
    });

    useEffect(() => {
        setRows([...dataGridProps.rows]);
    }, [dataGridProps.rows]);

    const columns = React.useMemo<GridColDef<IDatastream>[]>(
        () => [
            { field: "@iot.id", headerName: "ID", type: "string", minWidth: 75 },
            { field: "name", headerName: "name", type: "string", minWidth: 200 },
            { field: "unitOfMeasurement", headerName: "Unit", valueGetter: params => params.row.unitOfMeasurement?.symbol, minWidth: 25 },
            { field: "agency", headerName: "Agency", valueGetter: params => params.row.Thing?.properties?.agency, minWidth: 150 },
            { field: "Location", headerName: "Location", valueGetter: params => params.row.Thing?.Locations?.map((loc) => loc.name).join(', '), minWidth: 300 },
            { field: "sensor", headerName: "Sensor", valueGetter: params => params.row.Sensor?.name },
            {field: "locationID", headerName: "Location ID",
                renderCell: function render({row}) {
                    const locationId = row.Thing.Locations[0]['@iot.id']
                    return (<div>
                        <a
                        href={`${settings.st2_url}/Locations(${locationId})`}
                        >{locationId}</a>
                    </div>)
                },

            minWidth: 150},
            {field: "ThingID", headerName: "Thing ID",
                renderCell: function render({row}){
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
                renderCell: function render({ row }) {
                    return (
                        <div>
                            <EditButton hideText recordItemId={row['@iot.id']} />
                            <ShowButton hideText recordItemId={row['@iot.id']} />
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

    const handleSelectionChange = (selectionModel) => {
        const selectedRow = rows.find((row)=>{
            return row["@iot.id"]===selectionModel[0]
        })
        if (!selectedRow) return;

        const name =selectedRow.Thing?.Locations?.map((loc) => loc.name).join(', ')
        setSelectedLocationName(name)
        setDatastreamId(selectionModel[0]);
    };

    useEffect(() => {
        if (!datastreamId) return;

        triggerAll().then(
            (data) => {
                console.log('hydrograph data', data);
                setObservations(data)
            }
        );
    }, [datastreamId]);

    const findDuplicates = async () => {
        const updatedRows = rows.map(async (row) => {
            // row.Sensor.name = 'asdfs';
            console.log('row', row['@iot.id']);

            const data = await triggerAll({ resource: `Datastreams(${row['@iot.id']})/Observations` });
            console.log('hydrograph data', row['@iot.id'], data);
            if (data.length == 0) {
                row.name = `${row.name} (Duplicate)`;
            }

            return row;
        });


        setRows(await Promise.all(updatedRows));
    };

    return (
        <>
            <ListPage
                getRowId={(row) => row["@iot.id"]}
                columns={columns}
                dataGridProps={{ ...dataGridProps, rows }}
                onSelectionChange={handleSelectionChange}
                isLoading={isLoading}
            >
                <Card sx={{padding: 2, margin: 1}}>
                    <ST2Hydrograph
                        name={locationName}
                        observations={observations} />
                </Card>
                <Card sx={{padding: 2, margin: 1}}>
                    <Stack direction={'row'}>
                        <DebouncedTextInput
                        value={filterLocationName}
                        setValue={setFilterLocationName}
                        delay={1000}
                        options={{label: 'Location',
                            style: {width: '60%'}}}
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
                </Card>
                {/*<Card>*/}
                {/*    <Button onClick={findDuplicates}>Find Duplicates</Button>*/}
                {/*</Card>*/}
            </ListPage>
        </>
    );
};
// ============= EOF =============================================
