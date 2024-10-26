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

import React, {useState} from "react";
import {fetcher} from "../../../providers/amp-data-provider";
import {Layer, Map, NavigationControl, Popup, Source} from "react-map-gl";
import {ExportButton, useAutocomplete} from "@refinedev/mui";
import LoadingButton from "@mui/lab/LoadingButton";
import {Alert, Autocomplete, Dialog, FormControl, InputAdornment, InputLabel, TextField} from "@mui/material";
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

export const Querybuilder: React.FC = () => {
    const [popupContent, setPopupContent] = useState<any>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    // const [PointID, setPointID] = useState<string>('');
    const [onlyActiveLocations, setOnlyActiveLocations] = useState<boolean>(false);
    const [continuousPressureLocations, setContinuousLocation] = useState<boolean>(false);
    const [continuousAcousticLocations, setContinuousAcousticLocations] = useState<boolean>(false);
    const [county, setCounty] = useState<ICounty | null>(null);
    const [projectRegion, setProjectRegion] = useState<string>('');
    const [exportConfig, setExportConfig] = useState<any>({
        use_water_levels: false,
        use_water_chemistry: false
    })

    const [resultFeatureCollection, setResultFeatureCollection] = useState<any>({
        type: 'FeatureCollection',
        features: []
    })

    const [selectionPolygons, setSelectionPolygons] = useState([]); // [polygon1, polygon2, ...
    const [countyFeature, setCountyFeature] = useState<any>()
    const [locationType, setLocationType] = useState<string>('');

    const {autocompleteProps} = useAutocomplete<ICounty>({
        resource: "counties",
    });

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

    const params = {
        county: county?.name,
        wkt: getWKT(),
        site_type: locationType,
        only_active_locations: onlyActiveLocations,
        continuous_pressure_locations: continuousPressureLocations,
        continuous_acoustic_locations: continuousAcousticLocations
    }

    const {triggerExport, isLoading: isLoadingExport} = useExport({
        resource: 'locations',
        pageSize: 1000,
        meta: {
            params: params,
            exportConfig: exportConfig
        }
    })

    const {isLoading, triggerAll} = useAll({
        resource: 'locations',
        meta: {
            params: params
        }
    })
    // console.log('useall', data)
    // const {data, isLoading, isError} = useList<ILocation, HttpError>(
    //     {
    //     resource: 'locations',
    //         meta: {
    //             params: {county: county?.name,
    //                      wkt: selectionPolygon? stringify(selectionPolygon): null},
    //         }
    //     }
    // )

    // const {
    //     saveButtonProps,
    //     register,
    //     control,
    //     formState: { errors },
    // } = useForm<IQuery, HttpError, Nullable<IQuery>>();

    // const {
    //     refineCore: { onFinish, formLoading, query },
    //     register,
    //     handleSubmit,
    //     formState: { errors },
    //     saveButtonProps,
    // } = useForm<IQuery, HttpError, Nullable<IQuery>>({
    //     refineCoreProps: {
    //         // resource: "products",
    //         // action: "edit",
    //         // id: 123,
    //     },
    // });


    const handleSubmit = async (e: any) => {
        console.log('handleSubmit', county, locationType)

        // only search if county or project region or polygon is selected
        if (county === null && selectionPolygon === null && projectRegion === '') {
            setAlertOpen(true)
            return
        }

        let data = await triggerAll()

        if (county !== null) {
            let county_url = `tabular/counties/${county.name}`
            fetcher(county_url).then((response) => {
                return response.data
            }).then((data) => {
                setCountyFeature(data)
            })
        } else if (projectRegion !== '') {
            let data = parse(ProjectRegionWKTs[projectRegion])
            setCountyFeature(data)
        }
        else {
            setCountyFeature(null)
        }

        const geoJson = toGeoJson(data)
        setResultFeatureCollection(geoJson)
    }

    const handleClose = () => {
        setAlertOpen(false);
    };

    const onMouseMove = (e: any, features: any[], mapRef: any) => {
        features = features.filter((f) => f.layer.id ==='location')
        if (features.length > 0) {
            mapRef.current.getCanvas().style.cursor = 'pointer'
            SetMapPopupContent({features, setPopupContent})
        }else{
            mapRef.current.getCanvas().style.cursor = 'grab'
            setPopupContent(null)
        }
    }

    const handleProjectRegion = (e)=>{
        let pr = e.target.value as string
        setProjectRegion(pr)
        let data = parse(ProjectRegionWKTs[pr])
        setCountyFeature(data)

    }

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

            <Grid container spacing={2}>
                <Grid>
                    <FormControlLabel
                        control={<Checkbox
                            checked={onlyActiveLocations}
                            onChange={(e) => setOnlyActiveLocations(e.target.checked)}
                        />}
                        label="Only Active Locations"
                    />
                    <FormControlLabel
                        control={<Checkbox
                            checked={continuousPressureLocations}
                            onChange={(e) => setContinuousLocation(e.target.checked)}
                        />}
                        label="Continuous Pressure Locations"
                    />
                    <FormControlLabel
                        control={<Checkbox
                            checked={continuousAcousticLocations}
                            onChange={(e) => setContinuousAcousticLocations(e.target.checked)}
                        />}
                        label="Continuous Acoustic Locations"
                    />
                </Grid>
                <Grid>
                    <Box mt={2}>
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label">Location Type</InputLabel>
                            <Select
                                variant={'outlined'}
                                label="Location Type"
                                value={locationType}
                                onChange={(e: SelectChangeEvent) => {
                                    setLocationType(e.target.value as string)
                                }}
                                endAdornment={
                                    locationType !== '' && (

                                        <InputAdornment sx={{marginRight: "15px"}} position="end">
                                            <IconButton
                                                onClick={() => {
                                                    setLocationType('');
                                                }}
                                            >
                                                <ClearIcon fontSize="small"></ClearIcon>
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            >
                                {
                                    LocationTypes.map((lt) => {
                                        return <MenuItem
                                            key={lt}
                                            value={lt}>{lt}</MenuItem>
                                    })
                                }
                            </Select>
                        </FormControl>
                    </Box>
                    <Box mt={2}>
                        <FormControl fullWidth>
                            <InputLabel>Project Region</InputLabel>
                            <Select
                                variant={'outlined'}
                                label="Project Region"
                                value={projectRegion}
                                onChange={handleProjectRegion}
                                // onChange={(e: SelectChangeEvent) => {
                                //     setProjectRegion(e.target.value as string)
                                // }}
                                endAdornment={
                                    projectRegion !== '' && (
                                        <InputAdornment sx={{marginRight: "15px"}} position="end">
                                            <IconButton
                                                onClick={() => {
                                                    setProjectRegion('');
                                                }}
                                            >
                                                <ClearIcon fontSize="small"></ClearIcon>
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                            >
                                {
                                    ProjectRegions.map((lt) => {
                                        return <MenuItem
                                            key={lt}
                                            value={lt}>{lt}</MenuItem>
                                    })
                                }
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
                <Grid >
                    <Autocomplete
                        // clearIcon={true}
                        // clearOnEscape={true}
                        {...autocompleteProps}
                        value={county}
                        onChange={(e, value) => setCounty(value)}
                        getOptionLabel={(item) => item.name}
                        isOptionEqualToValue={(option, value) =>
                            value === undefined ||
                            option?.id?.toString() === (value?.id ?? value)?.toString()
                        }
                        // placeholder="Select County"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="County"
                                margin="normal"
                                variant="outlined"
                            />
                        )}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={2} mb={3}>
                <Grid >
                    <LoadingButton
                        loadingPosition={'start'}
                        startIcon={<SearchOutlinedIcon/>}
                        onClick={handleSubmit}
                        loading={isLoading}
                        variant={'contained'}
                        sx={{margin: 2}}
                        >
                        Run Query
                    </LoadingButton>
                </Grid>
                <Grid >
                    <ExportButton
                        sx={{margin: 2}}
                        variant={'contained'}
                        loading={isLoadingExport}
                        onClick={triggerExport}>
                        Export Locations
                    </ExportButton>
                    <FormControlLabel control={<Checkbox
                    checked={exportConfig.use_water_levels}
                    onChange={(e) => setExportConfig({use_water_levels: e.target.checked as boolean})}
                    />} label="With WaterLevels" />
                    <FormControlLabel control={<Checkbox
                        checked={exportConfig.use_water_chemistry}
                        onChange={(e) => setExportConfig({use_water_chemistry: e.target.checked as boolean})}
                    />} label="With WaterChemistry" />
                </Grid>
            </Grid>



            <MapComponent
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
                            'circle-color':
                                [
                                    'match',
                                    ['get', 'site_type'],
                                    'Groundwater other than spring (well)', '#224bb4',
                                    'Spring', '#517938',
                                    'Ephemeral stream', '#b42722',
                                    'Perennial stream', '#d5633a',
                                    '#000000'
                                ],
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

        </div>
    )
}
// ============= EOF =============================================