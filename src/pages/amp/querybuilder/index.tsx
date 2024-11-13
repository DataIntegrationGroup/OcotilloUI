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
import MapComponent from '../../../components/MapComponent';
// import TextField from "@mui/material/TextField";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import React, {useEffect, useState} from "react";
import {fetcher} from "../../../providers/amp-data-provider";
import {Layer, Map, NavigationControl, Popup, Source} from "react-map-gl";
import {ExportButton, useAutocomplete, useDataGrid} from "@refinedev/mui";
import LoadingButton from "@mui/lab/LoadingButton";
import {
    Alert,
    Autocomplete,
    Card,
    CircularProgress,
    Dialog,
    FormControl,
    InputAdornment,
    InputLabel,
    TextField
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {HttpError, useExport, useList, useMany} from "@refinedev/core";
import {stringify, parse} from "wkt";
import {ILocation} from "@/interfaces/amp";
import {useAll} from "@/useAll";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import {Box} from "@mui/system";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import {SetMapPopupContent} from "@/components/MapPopupComponent";
import {CheckBox} from "@mui/icons-material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {DataGrid} from "@mui/x-data-grid";
import {ExportControl} from "@/pages/amp/querybuilder/ExportControl";
import {ClearableSelect} from "@/components/ClearableSelect";
import {ANALYTES} from "@/components/enums";
import FilterComponent from "@/components/FilterComponent";
import {LegendComponent} from "@/components/LegendComponent";
import {DataDrivenPropertyValueSpecification} from "mapbox-gl";

// import {Layer, Source} from "mapbox-gl";

// {...register("content", {
//     required: "This field is required",
// })}
// error={!!errors.content}
// helperText={errors.content?.message}

// interface IQuery {
//     name: string;
//     material: string;
// };

interface ICounty {
    id: number;
    name: string;
}


const LocationTypes = [
    "Well",
    "Spring",
    "Stream",

]

const ProjectRegions = [
    "Pecos Valley Artesian Conservancy District",
    "Rio Grande",
    "Estancia Basin",
    "San Juan Basin",
    "Jemez River Basin",
    "Rio Chama Basin",
    "Rio Puerco Basin",
    "La Jencia Basin",
]

const ProjectRegionWKTs = {
    "Pecos Valley Artesian Conservancy District": "POLYGON((-104.000000 33.000000, -104.000000 34.000000, -105.000000 34.000000, -105.000000 33.000000, -104.000000 33.000000))",
    "Rio Grande": "POLYGON((-106.000000 31.000000, -106.000000 36.000000, -108.000000 36.000000, -108.000000 31.000000, -106.000000 31.000000))",
    "Estancia Basin": "POLYGON((-106.000000 34.000000, -106.000000 35.000000, -107.000000 35.000000, -107.000000" +
        " 34.000000, -106.000000 34.000000))",
    "San Juan Basin": "POLYGON((-107.000000 35.000000, -107.000000 37.000000, -109.000000 37.000000, -109.000000 35.000000, -107.000000 35.000000))",
    "Jemez River Basin": "POLYGON((-106.000000 35.000000, -106.000000 36.000000, -107.000000 36.000000, -107.000000 35.000000, -106.000000 35.000000))",
    "Rio Chama Basin": "POLYGON((-106.000000 35.000000, -106.000000 36.000000, -107.000000 36.000000, -107.000000 35.000000, -106.000000 35.000000))",
    "Rio Puerco Basin": "POLYGON((-106.000000 34.000000, -106.000000 35.000000, -107.000000 35.000000, -107.000000" +
        " 34.000000, -106.000000 34.000000))",
    "La Jencia Basin": "POLYGON((-106.000000 34.000000, -106.000000 35.000000, -107.000000 35.000000, -107.000000" +
        " 34.000000, -106.000000 34.000000))"
}


const toGeoJson = (data: any) => {
    return {
        'type': 'FeatureCollection',
        'features': data.map((d: any) => {
            return {
                'type': 'Feature',
                'geometry': d.geometry,
                'properties': d
            }
        })
    }
}

// const FilterComponent = () => {
//     // make a component with a select box for Well Depth and Hole Depth, a comparison operator, and a value
//
// }


export const Querybuilder: React.FC = () => {
    const [popupContent, setPopupContent] = useState<any>(null);
    const [analytes, setAnalytes] = useState<string[]>([]);
    const [alertOpen, setAlertOpen] = useState(false);
    // const [PointID, setPointID] = useState<string>('');
    const [onlyActiveLocations, setOnlyActiveLocations] = useState<boolean>(true);
    const [continuousPressureLocations, setContinuousLocation] = useState<boolean>(false);
    const [continuousAcousticLocations, setContinuousAcousticLocations] = useState<boolean>(false);
    const [county, setCounty] = useState('')
    const [projectRegion, setProjectRegion] = useState<string>('');
    const [projectName, setProjectName] = useState<string>('');
    const [field, setField] = useState<string>('');
    const [operator, setOperator] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [includeLegacyUSGS, setIncludeLegacyUSGS] = useState<boolean>(false);
    const [includeLegacyTWDB, setIncludeLegacyTWDB] = useState<boolean>(false);

    // const [exportConfig, setExportConfig] = useState<any>({
    //     use_water_levels: false,
    //     use_water_chemistry: false
    // })


    const [resultFeatureCollection, setResultFeatureCollection] = useState<any>({
        type: 'FeatureCollection',
        features: []
    })

    const [selectionPolygons, setSelectionPolygons] = useState([]); // [polygon1, polygon2, ...
    const [countyFeature, setCountyFeature] = useState<any>()
    const [locationType, setLocationType] = useState<string>('');

    const {
        data: countiesObjects,
        isLoading: isLoadingCounties,
        isError: isErrorCounties
    } = useList<ICounty, HttpError>({
        resource: 'counties',
    })

    const {data: projects} = useList(
        {
            resource: 'projects',
            dataProviderName: 'amp',
            pagination: {current: 1, pageSize: 1000}
        }
    )
    const ps = projects?.data ?? [];
    const projectNames = ps.map((p) => {
        return p.Project
    })

    const cs = countiesObjects?.data ?? [];
    const countiesNames = cs.map((c) => {
        return c.name
    })

    let polygonKeys = Object.keys(selectionPolygons);
    let selectionPolygon = null;
    if (polygonKeys.length > 0) {
        selectionPolygon = selectionPolygons[polygonKeys[0]];
    }

    const getWKT = () => {
        if (selectionPolygon) {
            return stringify(selectionPolygon)
        } else {
            return ProjectRegionWKTs[projectRegion]
        }
    }

    const getFilter = () => {
        if (field === '' || operator === '' || value === '') {
            return ''
        }
        return JSON.stringify({field: field, operator: operator, value: value})
    }

    const params = {
        county: county,
        wkt: getWKT(),
        site_type: locationType,
        only_active_locations: onlyActiveLocations,
        continuous_pressure_locations: continuousPressureLocations,
        continuous_acoustic_locations: continuousAcousticLocations,
        analytes: analytes.join(','),
        filter: getFilter(),
        project: projectName,
        include_legacy_usgs: includeLegacyUSGS,
        include_legacy_twdb: includeLegacyTWDB
    }

    const wellEnabled = locationType === 'Well';
    // let expand;
    // if (exportType === 'WaterChemistry') {
    //     expand = 'water_chemistry'
    // }
    // const exportParams = {
    //     ...params,
    //     // expand: expand
    // }

    // const {triggerExport, isLoading: isLoadingExport} = useExport({
    //     resource: 'locations',
    //     pageSize: 1000,
    //     meta: {
    //         params: params,
    //         exportConfig: exportConfig
    //     }
    // })

    const {isLoading, triggerAll} = useAll({
        resource: 'locations',
        meta: {
            params: params
        }
    })

    const {dataGridProps} = useDataGrid(
        {
            resource: 'locations',
            meta: {
                params: params,
            }
        }
    )

    const spatialFilterEnabled = county !== '' || selectionPolygon !== null || projectRegion !== '';
    useEffect(() => {
        if ((operator!='' || field!='') && value=='') {
            return
        }

        if (!spatialFilterEnabled && projectName === '' && locationType === '') {
            setResultFeatureCollection({type: 'FeatureCollection', features: []})
            setCountyFeature(null)
            return
        }

        if (county !== '') {
            let county_url = `tabular/counties/${county}`
            fetcher(county_url).then((response) => {
                return response.data
            }).then((data) => {
                setCountyFeature(data)
            })
        } else if (projectRegion !== '') {
            let data = parse(ProjectRegionWKTs[projectRegion])
            setCountyFeature(data)
        } else {
            setCountyFeature(null)
        }

        triggerAll().then((data) => {
            const geoJson = toGeoJson(data)
            setResultFeatureCollection(geoJson)
        })

    }, [county, selectionPolygon, projectRegion,
        locationType, onlyActiveLocations, continuousPressureLocations, continuousAcousticLocations,
        analytes, field, operator, value, projectName, includeLegacyUSGS, includeLegacyTWDB]);

    // const {triggerExport: triggerExportCustom, isLoading: isLoadingExportCustom} = useExport({
    //     resource: exportType.toLowerCase(),
    //     pageSize: 1000,
    //     meta: {
    //         params: exportParams,
    //         exportConfig: exportConfig
    //     }
    // })

    const handleClose = () => {
        setAlertOpen(false);
    };

    const onMouseMove = (e: any, features: any[], mapRef: any) => {
        features = features.filter((f) => f.layer.id === 'location')
        if (features.length > 0) {
            mapRef.current.getCanvas().style.cursor = 'pointer'
            SetMapPopupContent({features, setPopupContent})
        } else {
            mapRef.current.getCanvas().style.cursor = 'grab'
            setPopupContent(null)
        }
    }

    // const handleProjectRegion = (e) => {
    //     let pr = e.target.value as string
    //     setProjectRegion(pr)
    //     let data = parse(ProjectRegionWKTs[pr])
    //     setCountyFeature(data)
    //
    // }

    // const getLocationColumns = () => {
    //     return
    // }

    const columns = [
        {
            field: 'PointID',
            headerName: 'PointID',
            type: 'string',
            minWidth: 80
        },
        {
            field: 'site_type',
            headerName: 'Site Type',
            type: 'string',
            minWidth: 200
        },
        {
            field: 'SiteNames',
            headerName: 'Site Names',
            type: 'string',
            minWidth: 250
        },
        {
            field: 'Easting',
            headerName: 'Easting',
            type: 'integer',
            minWidth: 80
        },
        {
            field: 'Northing',
            headerName: 'Northing',
            type: 'integer',
            minWidth: 80
        }
    ]

    const legendOptions = [
        {label: 'Groundwater other than spring (well)', color: '#224bb4'},
        {label: 'Spring', color: '#517938'},
        {label: 'Ephemeral stream', color: '#b42722'},
        {label: 'Perennial stream', color: '#d5633a'},
        {label: 'Unknown', color: '#000000'}
    ]
    const getCircleColors = (): DataDrivenPropertyValueSpecification<string> => {
        let style = ['match', ['get', 'site_type']]
        legendOptions.forEach((item) => {
            style.push(item.label)
            style.push(item.color)
        })
        style.push('#000000')
        return style as DataDrivenPropertyValueSpecification<string>
    }


    console.log('daa', dataGridProps)
    return (
        <div>
            <h1>QueryBuilder</h1>

            {/*<TextField*/}
            {/*    name="PointID"*/}
            {/*    label="PointID"*/}
            {/*    onChange={(e) => setPointID(e.target.value)}*/}
            {/*/>*/}
            <Dialog
                // selectedValue={selectedValue}
                open={alertOpen}
                onClose={handleClose}
            >
                <Alert severity="error">Please select a County or a Project Region or draw a polygon on the map</Alert>
            </Dialog>

            <Grid container spacing={2} p={3}>
                <Stack direction={'row'} sx={{width: 1}}>
                    <ClearableSelect label={'Location Type'}
                                     value={locationType} setValue={setLocationType} values={LocationTypes}/>
                    <ClearableSelect label={'Project Region'}
                                     value={projectRegion} setValue={setProjectRegion} values={ProjectRegions}/>
                    <ClearableSelect label={'County'}
                                     value={county} setValue={setCounty} values={countiesNames}/>
                </Stack>
                <Stack direction={"row"} sx={{width: 1}} pt={2}>
                    <ClearableSelect label={'Analytes'}
                                     value={analytes}
                                     setValue={setAnalytes}
                                     values={ANALYTES}
                                     multiple={true}/>
                    <FilterComponent
                        field={field}
                        setField={setField}
                        operator={operator}
                        setOperator={setOperator}
                        value={value}
                        setValue={setValue}
                    />
                </Stack>
                <Stack direction={'row'} sx={{width: 1}} pt={2}>
                    <ClearableSelect label={'Project Name'}
                                     value={projectName}
                                     setValue={setProjectName}
                                     values={projectNames}/>
                </Stack>

                {/*well check boxes*/}
                <Grid xs={12} p={1}>
                    <FormControlLabel
                        control={<Checkbox
                            checked={includeLegacyUSGS}
                            onChange={(e) => setIncludeLegacyUSGS(e.target.checked)}
                        />}
                        label="Include Legacy USGS"
                    />
                    <FormControlLabel
                        control={<Checkbox
                            checked={includeLegacyTWDB}
                            onChange={(e) => setIncludeLegacyTWDB(e.target.checked)}
                        />}
                        label="Include Legacy TWDB"
                    />
                    <FormControlLabel
                        disabled={!wellEnabled}
                        control={<Checkbox
                            checked={onlyActiveLocations}
                            onChange={(e) => setOnlyActiveLocations(e.target.checked)}
                        />}
                        label="Only Active Locations"
                    />
                    <FormControlLabel
                        disabled={!wellEnabled}
                        control={<Checkbox
                            checked={continuousPressureLocations}
                            onChange={(e) => setContinuousLocation(e.target.checked)}
                        />}
                        label="Continuous Pressure Locations"
                    />
                    <FormControlLabel
                        disabled={!wellEnabled}
                        control={<Checkbox
                            checked={continuousAcousticLocations}
                            onChange={(e) => setContinuousAcousticLocations(e.target.checked)}
                        />}
                        label="Continuous Acoustic Locations"
                    />
                </Grid>

                <Grid xs={12}>
                    <Box border={1} p={2}>
                        <ExportControl
                            disabled={!spatialFilterEnabled}
                            params={params}/>
                    </Box>
                </Grid>

            </Grid>

            <Grid container>
                <Grid xs={6}>
                    <DataGrid
                        {...dataGridProps}
                        rowHeight={25}
                        getRowId={(row) => row.PointID}
                        columns={columns}
                    />
                </Grid>
                <Grid xs={6}>
                    <LegendComponent items={legendOptions}/>
                    <MapComponent
                        isLoading={isLoading}
                        showDrawControls={{show: true, position: 'top-right'}}
                        setSelectionPolygons={setSelectionPolygons}
                        setPopupContent={setPopupContent}
                        popupContent={popupContent}
                        onMouseMoveCallback={onMouseMove}
                    >
                        <Source
                            key='foo'
                            id='foo'
                            type='geojson'
                            data={resultFeatureCollection}>
                            <Layer
                                id="location"
                                type="circle"
                                paint={{
                                    'circle-radius': 6,
                                    'circle-color': getCircleColors(),
                                    // [
                                    //     'match',
                                    //     ['get', 'site_type'],
                                    //     'Groundwater other than spring (well)', '#224bb4',
                                    //     'Spring', '#517938',
                                    //     'Ephemeral stream', '#b42722',
                                    //     'Perennial stream', '#d5633a',
                                    //     '#000000'
                                    // ],
                                    'circle-stroke-color': '#ffffff',
                                    'circle-stroke-width': 1,
                                }}
                            />
                        </Source>
                        {countyFeature && <Source
                            key='county'
                            id='countysource'
                            type='geojson'
                            data={countyFeature}>
                            <Layer
                                id="county"
                                type="fill"
                                paint={{
                                    "fill-color": "#9ab7d5",
                                    "fill-outline-color": "#000000",
                                    "fill-opacity": 0.25,
                                }}
                            />
                        </Source>}
                    </MapComponent>
                </Grid>
            </Grid>


        </div>
    )
}
// ============= EOF =============================================