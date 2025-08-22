import { useList } from '@refinedev/core'
import { ISensor } from '@/interfaces/ocotillo/ISensor'

export const useSensor = () => {
  const { data } = useList<ISensor>({
    resource: 'sensor',
    dataProviderName: 'ocotillo',
  })

  const sensor_options =
    data?.data.map((sensor: any) => ({
      label: sensor.name,
      value: sensor.id,
    })) || []

  return {
    ...data,
    options: sensor_options,
  }
}
