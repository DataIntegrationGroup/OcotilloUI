import { useLayer } from './'

export const useThingLayers = () => ({
  'water-wells': useLayer({
    thing_type: 'water well',
    label: 'Water Wells',
    color: '#9cd0ab',
  }),
  springs: useLayer({
    thing_type: 'spring',
    label: 'Springs',
    color: '#f0c0a0',
  }),
  'ephemeral-streams': useLayer({
    thing_type: 'ephemeral stream',
    label: 'Ephemeral Streams',
    color: '#f5df73',
  }),
  'perennial-streams': useLayer({
    thing_type: 'perennial stream',
    label: 'Perennial Streams',
    color: '#da55c4',
  }),
  'meteorological-stations': useLayer({
    thing_type: 'meteorological station',
    label: 'Meteorological Stations',
    color: '#2b7dc0',
  }),
})
