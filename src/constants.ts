import { MapboxStyleDefinition } from 'mapbox-gl-style-switcher'

export const MAPBOX_BASEMAPS: MapboxStyleDefinition[] = [
  { title: 'Light', uri: 'mapbox://styles/mapbox/light-v11' },
  { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v11' },
  { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v12' },
  { title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v12' },
  {
    title: 'Satellite Streets',
    uri: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-v9' },
  { title: 'Basic', uri: 'mapbox://styles/mapbox/basic-v9' },
  { title: 'Bright', uri: 'mapbox://styles/mapbox/bright-v9' },
]

export const LIGHT_MAPBOX_BASEMAP = 'mapbox://styles/mapbox/light-v11'
export const DARK_MAPBOX_BASEMAP = 'mapbox://styles/mapbox/dark-v11'
export const DEFAULT_MAPBOX_BASEMAP = LIGHT_MAPBOX_BASEMAP

export const THEMED_MAPBOX_BASEMAPS = {
  light: {
    title: 'Light',
    uri: LIGHT_MAPBOX_BASEMAP,
  },
  dark: {
    title: 'Dark',
    uri: DARK_MAPBOX_BASEMAP,
  },
} as const

export enum GroupType {
  Wells = 'Wells',
  Springs = 'Springs',
  Contacts = 'Contacts',
  Messages = 'Messages',
  Assets = 'Assets',
}

export const INCHES_IN_A_FOOT = 12
