import type { SensorSourceConfig } from './schema'
import { vanEssenDiver } from './sources/van-essen-diver'
import { wellntel } from './sources/wellntel'

/**
 * The sensor source registry.
 *
 * To add a telemetered sensor source: create a file in `./sources/` exporting
 * a `defineSensorSource({...})` config, then add it to this array. That is the
 * whole change -- the dashboard, alert engine, and mock provider are all
 * driven off this registry and contain no per-source logic.
 */
export const SENSOR_SOURCES: SensorSourceConfig[] = [vanEssenDiver, wellntel]

/** Sources the dashboard should fetch and render. */
export const enabledSensorSources = (): SensorSourceConfig[] =>
  SENSOR_SOURCES.filter((source) => source.enabled)

export const getSensorSource = (id: string): SensorSourceConfig | undefined =>
  SENSOR_SOURCES.find((source) => source.id === id)

// Duplicate ids would make `getSensorSource` silently return the wrong config.
const ids = SENSOR_SOURCES.map((source) => source.id)
const duplicate = ids.find((id, i) => ids.indexOf(id) !== i)
if (duplicate) {
  throw new Error(`Duplicate sensor source id in registry: "${duplicate}"`)
}

export * from './schema'
