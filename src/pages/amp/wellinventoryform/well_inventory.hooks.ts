import {
  getElevationDatums,
  getElevationMethods,
  getCompletionSources,
  getConstructionMethods,
  getCoordinateDatums,
  getCoordinateAccuracies,
  getCoordinateMethods,
  getCurrentUses,
  getDepthSources,
  getFormations,
  getMonitoringStatuses,
  getProjects,
  getSiteTypes,
  getStatus,
} from './well_inventory.service'

export const useGetWellInventoryLookupTablesData = () => {
  const CoordinateAccuraciesQuery = getCoordinateAccuracies()
  const CoordinateMethodsQuery = getCoordinateMethods()
  const CoordinateDatumsQuery = getCoordinateDatums()
  const ElevationDatumsQuery = getElevationDatums()
  const ElevationMethodsQuery = getElevationMethods()
  const DepthSourcesQuery = getDepthSources()
  const CompletionSourcesQuery = getCompletionSources()
  const StatusQuery = getStatus()
  const MonitoringStatusesQuery = getMonitoringStatuses()
  const FormationsQuery = getFormations()
  const ConstructionMethodsQuery = getConstructionMethods()
  const CurrentUsesQuery = getCurrentUses()
  const ProjectsQuery = getProjects()
  const SiteTypesQuery = getSiteTypes()

  return {
    CoordinateAccuraciesQuery,
    CoordinateMethodsQuery,
    CoordinateDatumsQuery,
    ElevationDatumsQuery,
    ElevationMethodsQuery,
    DepthSourcesQuery,
    CompletionSourcesQuery,
    StatusQuery,
    MonitoringStatusesQuery,
    FormationsQuery,
    ConstructionMethodsQuery,
    CurrentUsesQuery,
    ProjectsQuery,
    SiteTypesQuery,
  }
}
