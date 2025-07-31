import { Controller } from 'react-hook-form'
import { DateTimePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { useAutocomplete } from '@refinedev/mui'
import { ILexicon } from '@/interfaces/dataforge/ILexicon'
import { Hydrograph } from '@/components/Hydrographs/Hydrograph'
import { IHydrographDatasource } from '@/interfaces/st2/IHydrographDatasource'
import { useDataProvider } from '@refinedev/core'

interface EntryProps {
  control: any
  errors: any
  register: any
  watch: any
}

export const GroundwaterLevelEntryComponent: React.FC<EntryProps> = ({
  control,
  errors,
  register,
  watch,
}) => {
  const { autocompleteProps: autocompletePropsReleaseStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'dataforge',
      meta: {
        params: { category: 'release_status' },
      },
    })
  const { autocompleteProps: autocompletePropsLevelStatus } =
    useAutocomplete<ILexicon>({
      resource: 'lexicon',
      dataProviderName: 'dataforge',
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
  const dataForgeDataProvider = dataProvider('dataforge')

  const depthToWater = watch('depth_to_water')
  const observationTimestamp = watch('observation_timestamp')
  const sensorID = watch('sensor_id')
  const thingID = watch('thing_id')

  useEffect(() => {
    const newResult = {
      phenomenonTime: observationTimestamp.toISOString(),
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
    const values = dataForgeDataProvider.getList({
      resource: 'observation/groundwater-level',
      meta: { params },
    })
    values.then((response) => {
      const obs = response.data.map((item) => ({
        phenomenonTime: item.observation_timestamp,
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

  return (
    <Box>
      <Hydrograph
        datasource={hydrographDatasource}
        refresh={refreshHydrograph}
      />
      <TextField
        {...register('depth_to_water')}
        error={!!errors.depth_to_water}
        helperText={errors.depth_to_water?.message}
        margin="normal"
        fullWidth
        label="Depth to Water (ft)"
        name="depth_to_water"
        type="number"
        autoFocus
      />
      <Controller
        name="observation_timestamp"
        control={control}
        render={({ field }) => (
          <DateTimePicker
            {...field}
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) => field.onChange(date ? date.toDate() : null)}
            label="Observation Timestamp"
            slotProps={{
              textField: {
                margin: 'normal',
                fullWidth: true,
                error: !!errors.observation_timestamp,
                helperText: errors.observation_timestamp?.message,
              },
            }}
          />
        )}
      />
      <TextField
        {...register('measuring_point_height')}
        error={!!errors.measuring_point_height}
        helperText={errors.measuring_point_height?.message}
        margin="normal"
        fullWidth
        label="Measuring Point Height (inches)"
        name="measuring_point_height"
        type="number"
      />
      <Controller
        name="release_status"
        control={control}
        rules={{ required: 'This field is required' }}
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
                error={!!errors.release_status}
                helperText={errors.release_status?.message}
              />
            )}
          />
        )}
      />
      <Controller
        name="level_status"
        control={control}
        rules={{ required: 'This field is required' }}
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
                error={!!errors.level_status}
                helperText={errors.level_status?.message}
              />
            )}
          />
        )}
      />
    </Box>
  )
}
