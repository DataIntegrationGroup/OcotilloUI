/**
 * Column titles for the Ocotillo water well list (`thing/list.tsx` DataGrid).
 * Map visible-layer CSV uses the same strings for the same fields so exports match the grid.
 */
export const WellListColumnLabels = {
  wellId: 'Well ID',
  name: 'Name',
  siteName: 'Site name',
  monitoring: 'Monitoring',
  createdAt: 'Created At',
  wellStatus: 'Well Status',
  type: 'Type',
  aquifers: 'Aquifers',
  releaseStatus: 'Release Status',
  wellDepthFt: 'Well Depth (ft)',
  holeDepthFt: 'Hole Depth (ft)',
  firstVisit: 'First Visit',
  contacts: 'Contacts',
  completed: 'Completed',
  driller: 'Driller',
  latitude: 'Latitude',
  longitude: 'Longitude',
  alternateIds: 'Alternate IDs',
} as const
