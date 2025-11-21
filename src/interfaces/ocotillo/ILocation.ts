import { z } from 'zod'
import {
  zLocationGeoJsonResponse,
  zLocationResponse,
} from '@/generated/zod.gen'

type _Generated = z.infer<typeof zLocationGeoJsonResponse>

export interface ILocationGeo extends _Generated {
  geometry: _Generated['geometry'] & {
    coordinates: [number, number, number?]
  }
}

export type ILocation = z.infer<typeof zLocationResponse>
