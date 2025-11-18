export interface ILocation {
  geometry: GeoPoint3D
  properties: {
    elevation?: number | null
    elevation_accuracy?: number | null
    elevation_method?: string | null
    elevation_unit?: string | null
    horizontal_datum?: string | null
    vertical_datum?: string | null
    utm_coordinates?: {
      easting?: number | null
      northing?: number | null
      utm_zone?: number | string | null
      horizontal_datum?: string | null
    }
  }
  created_at?: string
}

export interface GeoPoint3D extends GeoJSON.Point {
  coordinates: [number, number, number]
}
