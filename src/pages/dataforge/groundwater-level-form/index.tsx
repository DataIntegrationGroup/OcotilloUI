// import React, { useEffect, useState, useRef } from 'react'
// import Box from '@mui/material/Box'
// import { useForm } from '@refinedev/react-hook-form'
// import { HttpError, useDataProvider } from '@refinedev/core'
// import { IGroundwaterLevelForm } from '@/interfaces/dataforge/IGroundwaterLevel'
// import { Create, useAutocomplete } from '@refinedev/mui'
// import TextField from '@mui/material/TextField'
// import { DateTimePicker } from '@mui/x-date-pickers'
// import { Controller } from 'react-hook-form'
// import Autocomplete from '@mui/material/Autocomplete'
// import { IThing } from '@/interfaces/dataforge/IThing'
// // import { ISeries } from '@/interfaces/dataforge/ISeries'
// import { ILexicon } from '@/interfaces/dataforge/ILexicon'
// import { ISensor } from '@/interfaces/dataforge/ISensor'
// import dayjs from 'dayjs'
//
// import { MapComponent } from '@/components'
// import { Layer, Source } from 'react-map-gl'
// import { MapRef } from 'react-map-gl'
// import { Button, Stack } from '@mui/material'
// import { MapOutlined } from '@mui/icons-material'
// import { Hydrograph } from '@/components/Hydrographs/Hydrograph'
// import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
//
// export const GroundwaterLevelForm: React.FC = () => {
//   // const [selectedThingID, setSelectedThingID] = useState<number | null>(null)
//   const [selectedThingFeatureCollection, setSelectedThingFeatureCollection] =
//     useState(null)
//   const [displayMap, setDisplayMap] = useState(false)
//   const mapRef = useRef<MapRef>(null)
//   const [hydrographDatasource, setHydrographDatasource] = useState<
//     IHydrographDatasource[]
//   >([])
//   const [refreshHydrograph, setRefreshHydrograph] = useState<number>(0)
//
//   const {
//     control,
//     register,
//     formState: { errors },
//     saveButtonProps,
//     watch,
//   } = useForm<IGroundwaterLevelForm, HttpError, IGroundwaterLevelForm>({
//     refineCoreProps: {
//       resource: 'observation/groundwater-level',
//       dataProviderName: 'dataforge',
//     },
//     defaultValues: {
//       measuring_point_height: 1,
//       depth_to_water: 123,
//       observation_timestamp: new Date(),
//       observed_property: 'groundwater level',
//     },
//   })
//
//   const depthToWater = watch('depth_to_water')
//   const observationTimestamp = watch('observation_timestamp')
//   const sensorID = watch('sensor_id')
//   const thingID = watch('thing_id')
//
//   const { autocompleteProps: autocompletePropsReleaseStatus } =
//     useAutocomplete<ILexicon>({
//       resource: 'lexicon',
//       dataProviderName: 'dataforge',
//       meta: {
//         params: { category: 'release_status' },
//       },
//     })
//
//   const { autocompleteProps: autocompletePropsThing } = useAutocomplete<IThing>(
//     {
//       resource: 'thing',
//       dataProviderName: 'dataforge',
//       onSearch: (value) => [
//         {
//           field: 'name',
//           operator: 'contains',
//           value,
//         },
//       ],
//     }
//   )
//
//   const { autocompleteProps: autocompletePropsLevelStatus } =
//     useAutocomplete<ILexicon>({
//       resource: 'lexicon',
//       dataProviderName: 'dataforge',
//       meta: {
//         params: { category: 'level_status' },
//       },
//     })
//
//   const { autocompleteProps: autocompletePropsSensor } =
//     useAutocomplete<ISensor>({
//       resource: 'sensor',
//       dataProviderName: 'dataforge',
//       meta: {
//         params: {
//           thing_id: thingID,
//           observed_property: 'groundwater level',
//         },
//       },
//     })
//
//   useEffect(() => {
//     if (
//       selectedThingFeatureCollection &&
//       selectedThingFeatureCollection.features?.length > 0
//     ) {
//       const coords =
//         selectedThingFeatureCollection.features[0].geometry.coordinates
//
//       if (coords && mapRef.current) {
//         mapRef.current.flyTo({
//           center: coords,
//           zoom: 10, // adjust zoom as needed
//           essential: true,
//         })
//       }
//     }
//   }, [selectedThingFeatureCollection, displayMap])
//
//   const dataProvider = useDataProvider()
//   const dataForgeDataProvider = dataProvider('dataforge')
//
//   useEffect(() => {
//     const newResult = {
//       phenomenonTime: observationTimestamp.toISOString(),
//       result: Number(depthToWater),
//     }
//     if (!thingID || !sensorID) {
//       console.log('Thing ID or Sensor ID is not set, skipping data fetch.')
//       return
//     }
//
//     const params = {
//       thing_id: thingID,
//       sensor_id: sensorID,
//       observed_property: 'groundwater level',
//     }
//     const values = dataForgeDataProvider.getList({
//       resource: 'observation/groundwater-level',
//       meta: { params },
//     })
//     values.then((response) => {
//       const obs = response.data.map((item) => ({
//         phenomenonTime: item.observation_timestamp,
//         result: Number(item.depth_to_water),
//       }))
//
//       const source = {
//         data: [...obs, newResult],
//         id: 1,
//         name: 'Groundwater Level',
//         style: 'scatter',
//       }
//       setHydrographDatasource([source])
//       setRefreshHydrograph((prev) => (prev < 100 ? prev + 1 : 0))
//     })
//   }, [depthToWater, observationTimestamp, sensorID, thingID])
//
//   const coords =
//     selectedThingFeatureCollection?.features[0]?.geometry.coordinates
//   const initialViewState = {
//     longitude: coords ? coords[0] : -106.4,
//     latitude: coords ? coords[1] : 34.5,
//     zoom: 10,
//   }
//
//   const getOptionLabel = (option: any) => {
//     return `${option.name}: (${option.id})`
//   }
//
//   const getLexiconLabel = (option: ILexicon) => {
//     return option.term
//   }
//
//   return (
//     <Create goBack={<></>} saveButtonProps={saveButtonProps}>
//       <Box
//         component="form"
//         sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
//       >
//         <Stack direction="row" spacing={2}>
//           <Box sx={{ flexGrow: 1 }}>
//             <Controller
//               name="thing_id"
//               control={control}
//               rules={{ required: 'This field is required' }}
//               render={({ field }) => (
//                 <Autocomplete
//                   {...autocompletePropsThing}
//                   onChange={(_, newValue) => {
//                     if (newValue === null) {
//                       setSelectedThingFeatureCollection({
//                         type: 'FeatureCollection',
//                         features: [],
//                       })
//                     } else if (newValue?.geometry === null) {
//                       setSelectedThingFeatureCollection({
//                         type: 'FeatureCollection',
//                         features: [],
//                       })
//                     } else {
//                       setSelectedThingFeatureCollection({
//                         type: 'FeatureCollection',
//                         features: [
//                           {
//                             type: 'Feature',
//                             id: newValue?.id || null,
//                             geometry: newValue?.geometry,
//                           },
//                         ],
//                       })
//                     }
//                     // setSelectedThingID(newValue?.id || null)
//                     field.onChange(newValue?.id || null)
//                   }}
//                   getOptionKey={(option) => option.id}
//                   getOptionLabel={getOptionLabel}
//                   renderInput={(params) => (
//                     <TextField
//                       {...params}
//                       label="Thing"
//                       margin="normal"
//                       error={!!errors.thing_id}
//                       helperText={errors.thing_id?.message}
//                     />
//                   )}
//                 />
//               )}
//             />
//           </Box>
//           <Box sx={{ alignItems: 'center', display: 'flex' }}>
//             <Button
//               sx={{ height: '48px' }}
//               variant="outlined"
//               startIcon={<MapOutlined />}
//               onClick={() => {
//                 setDisplayMap((prev) => !prev)
//               }}
//             />
//           </Box>
//         </Stack>
//
//         <Box sx={{ paddingLeft: '50px', paddingRight: '50px' }}>
//           {displayMap && (
//             <MapComponent mapRef={mapRef} initialViewState={initialViewState}>
//               <Source
//                 key="selectedThing"
//                 id="selectedThing"
//                 type="geojson"
//                 data={selectedThingFeatureCollection}
//               >
//                 <Layer
//                   id="location"
//                   type="circle"
//                   paint={{
//                     'circle-radius': 6,
//                     'circle-color': '#B42222',
//                     'circle-stroke-color': '#ffffff',
//                     'circle-stroke-width': 1,
//                   }}
//                 />
//               </Source>
//             </MapComponent>
//           )}
//         </Box>
//         <Controller
//           name="sensor_id"
//           control={control}
//           render={({ field }) => (
//             <Autocomplete
//               {...autocompletePropsSensor}
//               disabled={thingID === null}
//               onChange={(_, newValue) => {
//                 field.onChange(newValue?.id || null)
//               }}
//               getOptionKey={(option) => option.id}
//               getOptionLabel={getOptionLabel}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Sensor"
//                   margin="normal"
//                   error={!!errors.sensor_id}
//                   helperText={errors.sensor_id?.message}
//                 />
//               )}
//             />
//           )}
//         />
//
//         <Hydrograph
//           datasource={hydrographDatasource}
//           refresh={refreshHydrograph}
//         />
//         <TextField
//           {...register('depth_to_water')}
//           error={!!errors.depth_to_water}
//           helperText={errors.depth_to_water?.message}
//           margin="normal"
//           fullWidth
//           label="Depth to Water (ft)"
//           name="depth_to_water"
//           type="number"
//           autoFocus
//         />
//         <Controller
//           name="observation_timestamp"
//           control={control}
//           render={({ field }) => (
//             <DateTimePicker
//               {...field}
//               value={field.value ? dayjs(field.value) : null}
//               onChange={(date) => field.onChange(date ? date.toDate() : null)}
//               label="Observation Timestamp"
//               slotProps={{
//                 textField: {
//                   margin: 'normal',
//                   fullWidth: true,
//                   error: !!errors.observation_timestamp,
//                   helperText: errors.observation_timestamp?.message,
//                 },
//               }}
//             />
//           )}
//         />
//         <TextField
//           {...register('measuring_point_height')}
//           error={!!errors.measuring_point_height}
//           helperText={errors.measuring_point_height?.message}
//           margin="normal"
//           fullWidth
//           label="Measuring Point Height (inches)"
//           name="measuring_point_height"
//           type="number"
//           autoFocus
//         />
//         <Controller
//           name="release_status"
//           control={control}
//           rules={{ required: 'This field is required' }}
//           render={({ field }) => (
//             <Autocomplete
//               {...autocompletePropsReleaseStatus}
//               onChange={(_, newValue) => {
//                 field.onChange(newValue?.term || null)
//               }}
//               getOptionKey={(option) => option.term}
//               getOptionLabel={getLexiconLabel}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Release Status"
//                   margin="normal"
//                   error={!!errors.release_status}
//                   helperText={errors.release_status?.message}
//                 />
//               )}
//             />
//           )}
//         />
//         <Controller
//           name="level_status"
//           control={control}
//           rules={{ required: 'This field is required' }}
//           render={({ field }) => (
//             <Autocomplete
//               {...autocompletePropsLevelStatus}
//               onChange={(_, newValue) => {
//                 field.onChange(newValue?.term || null)
//               }}
//               getOptionKey={(option) => option.term}
//               getOptionLabel={getLexiconLabel}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Level Status"
//                   margin="normal"
//                   error={!!errors.level_status}
//                   helperText={errors.level_status?.message}
//                 />
//               )}
//             />
//           )}
//         />
//       </Box>
//     </Create>
//   )
// }
