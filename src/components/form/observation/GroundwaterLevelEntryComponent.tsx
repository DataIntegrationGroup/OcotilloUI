import { Controller } from 'react-hook-form'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { useAutocomplete } from '@refinedev/mui'
import { ILexicon } from '@/interfaces/ocotillo/ILexicon'
import { Hydrograph } from '@/components/Hydrographs/Hydrograph'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import { useDataProvider } from '@refinedev/core'
import { ControlledSelectField } from '@/components'
import { useSensor } from '@/hooks/useSensor'

interface EntryProps {
  control: any
  errors: any
  register: any
  watch: any
  mode?: 'step' | 'standalone' // 'step' or 'standalone'
  fieldPrefix?: string
}

export const GroundwaterLevelEntryComponent: React.FC<EntryProps> = ({
  control,
  errors,
  register,
  watch,
  mode = 'standalone', // 'step' or 'standalone'
  fieldPrefix = 'observation.',
}) => {
  const { autocompleteProps: autocompletePropsReleaseStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'ocotillo',
      meta: {
        params: { category: 'release_status' },
      },
    })
  const { autocompleteProps: autocompletePropsLevelStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'ocotillo',
      meta: {
        params: { category: 'level_status' },
      },
    })
  const getLexiconLabel = (option: ILexicon) => {
    return option.term
  }
  const [hydrographDatasource, setHydrographDatasource] = useState<
    IHydrographDatasource[]
  >([])
  const [refreshHydrograph, setRefreshHydrograph] = useState<number>(0)

  const dataProvider = useDataProvider()
  const ocotilloDataProvider = dataProvider('ocotillo')

  const getFieldName = (fieldName: string) => {
    return `${fieldPrefix}${fieldName}`
  }

  const depthToWater = watch(getFieldName('depth_to_water'))
  const observationTimestamp = watch(getFieldName('observation_datetime'))
  const sensorID = watch(getFieldName('sensor_id'))
  const thingID = watch('thing_id')

  const { options: sensorOptions } = useSensor()

  useEffect(() => {
    const newResult = {
      phenomenonTime: observationTimestamp?.toISOString(),
      result: Number(depthToWater),
    }
    if (!thingID || !sensorID) {
      console.log('Thing ID or Sensor ID is not set, skipping data fetch.')
      return
    }

    const params = {
      thing_id: thingID,
      sensor_id: sensorID,
      observed_property: 'groundwater level',
    }
    const values = ocotilloDataProvider.getList({
      resource: 'observation/groundwater-level',
      meta: { params },
    })
    values.then((response) => {
      const obs = response.data.map((item) => ({
        phenomenonTime: item.observation_datetime,
        result: Number(item.depth_to_water),
      }))

      const source = {
        data: [...obs, newResult],
        id: 1,
        name: 'Groundwater Level',
        style: 'scatter',
      }
      setHydrographDatasource([source])
      setRefreshHydrograph((prev) => (prev < 100 ? prev + 1 : 0))
    })
  }, [depthToWater, observationTimestamp, sensorID, thingID])

  const getError = (fieldName: string) => {
    // const error = errors
    let error = errors
    if (mode === 'step') {
      error = errors.observation
    }
    let field_error = null
    if (!!error) {
      field_error = error[fieldName]
    }
    return {
      error: !!field_error,
      helperText: field_error?.message,
    }
  }

  return (
    <Box>
      <Hydrograph
        datasource={hydrographDatasource}
        refresh={refreshHydrograph}
      />
      {/*todo: probably need to make this an autocomplete field?*/}
      <ControlledSelectField
        {...getError('sensor_id')}
        control={control}
        name={getFieldName('sensor_id')}
        label={'Measurement Instrumentation'}
        options={sensorOptions}
      />
      <TextField
        {...register(getFieldName('depth_to_water'))}
        {...getError('depth_to_water')}
        margin="normal"
        fullWidth
        label="Depth to Water (ft)"
        name={getFieldName('depth_to_water')}
        type="number"
        autoFocus
      />
      <Controller
        name={getFieldName('observation_datetime')}
        control={control}
        render={({ field }) => (
          <DateTimePicker
            {...field}
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) => field.onChange(date ? date.toDate() : null)}
            label="Observation Timestamp"
            slotProps={{
              textField: {
                ...getError('observation_datetime'),
                margin: 'normal',
                fullWidth: true,
              },
            }}
          />
        )}
      />
      <TextField
        {...register(getFieldName('measuring_point_height'))}
        {...getError('measuring_point_height')}
        margin="normal"
        fullWidth
        label="Measuring Point Height (inches)"
        name="measuring_point_height"
        type="number"
      />
      <Controller
        name={getFieldName('release_status')}
        control={control}
        render={({ field }) => (
          <Autocomplete
            {...autocompletePropsReleaseStatus}
            value={
              autocompletePropsReleaseStatus.options.find(
                (option: any) => option.term === field.value
              ) || null
            }
            onChange={(_, newValue) => {
              field.onChange(newValue?.term || null)
            }}
            getOptionKey={(option) => option.term}
            getOptionLabel={getLexiconLabel}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Release Status"
                margin="normal"
                {...getError('release_status')}
              />
            )}
          />
        )}
      />
      <Controller
        name={getFieldName('level_status')}
        control={control}
        render={({ field }) => (
          <Autocomplete
            {...autocompletePropsLevelStatus}
            onChange={(_, newValue) => {
              field.onChange(newValue?.term || null)
            }}
            value={
              autocompletePropsLevelStatus.options.find(
                (option: any) => option.term === field.value
              ) || null
            }
            getOptionKey={(option) => option.term}
            getOptionLabel={getLexiconLabel}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Level Status"
                margin="normal"
                {...getError('level_status')}
              />
            )}
          />
        )}
      />
    </Box>
  )
}
