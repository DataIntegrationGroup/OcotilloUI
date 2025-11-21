import { z } from 'zod'
import { zLocationGeoJsonResponse } from '@/generated/zod.gen'

type _Generated = z.infer<typeof zLocationGeoJsonResponse>

export interface ILocation extends _Generated {
  geometry: _Generated['geometry'] & {
    coordinates: [number, number, number?]
  }
}
