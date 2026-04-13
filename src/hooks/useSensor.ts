import { useList } from '@refinedev/core'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

export const useSensor = () => {
  const { result, ...rest } = useList<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
  })

  const sensor_options =
    result?.data.map((sensor: any) => ({
      label: sensor.name,
      value: sensor.id,
    })) || []

  return {
    ...rest,
    result,
    isLoading: rest.query.isLoading,
    options: sensor_options,
  }
}
