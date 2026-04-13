import { useMemo } from 'react'
import { buildSensorDeploymentRows } from '@/utils'
export * from './useSensor'

export const useSensorDeploymentRows = ({
  deployments,
  sensors,
}: {
  deployments: readonly any[]
  sensors: readonly any[]
}) =>
  useMemo(
    () => buildSensorDeploymentRows(deployments, sensors),
    [deployments, sensors]
  )
