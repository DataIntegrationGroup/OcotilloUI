import { Route, Routes } from 'react-router'
import {
  ChemUpload,
  EquipmentList,
  EquipmentShow,
  HydrographCorrector,
  WaterDashboard,
  // Removed until it is in WIP state
  // ReportBuilder,
  Querybuilder,
  WellEdit,
  WellList,
  WellShow,
  LocationCreate,
  LocationEdit,
  LocationList,
  LocationShow,
  ManualWaterLevelList,
  ManualWaterLevelsCreate,
  ManualWaterLevelsEdit,
  ManualWaterLevelShow,
  AMPProjectList,
  WellInventoryForm,
  WaterLevelForm,
} from '@/pages/amp'
import ManualWaterLevelsBatchUpload from '@/pages/amp/manualwaterlevels/batchupload'
import { ProjectShow } from '@/pages/geochronology/projects'
import { LookupTableList, MeasuringAgencyList } from '@/components/lookuptable'
import { ErrorComponent } from '@refinedev/mui'

const lookupRoutes = [
  'measurement_method',
  'level_status',
  'data_quality',
  'data_source',
]

export const AMPRoutes = () => {
  return (
    <Routes>
      <Route path="hydrographcorrector" element={<HydrographCorrector />} />
      <Route path="dashboard" element={<WaterDashboard />} />
      <Route path="querybuilder" element={<Querybuilder />} />
      {/* Removed until it is in WIP state */}
      {/* <Route path="reportbuilder" element={<ReportBuilder />} /> */}
      <Route path="chemupload" element={<ChemUpload />} />
      <Route path="wells">
        <Route index element={<WellList />} />
        <Route path="edit/:id" element={<WellEdit />} />
        <Route path="show/:id" element={<WellShow />} />
      </Route>
      <Route path="locations">
        <Route index element={<LocationList />} />
        <Route path="create" element={<LocationCreate />} />
        <Route path="edit/:id" element={<LocationEdit />} />
        <Route path="show/:id" element={<LocationShow />} />
      </Route>
      <Route path="equipment">
        <Route index element={<EquipmentList />} />
        <Route path="show/:id" element={<EquipmentShow />} />
      </Route>
      <Route path="manualwaterlevels">
        <Route index element={<ManualWaterLevelList />} />
        <Route path="create" element={<ManualWaterLevelsCreate />} />
        <Route path="edit/:id" element={<ManualWaterLevelsEdit />} />
        <Route path="show/:id" element={<ManualWaterLevelShow />} />
        <Route path="batchupload" element={<ManualWaterLevelsBatchUpload />} />
      </Route>
      <Route path="projects">
        <Route index element={<AMPProjectList />} />
        <Route path="show/:id" element={<ProjectShow />} />
      </Route>
      <Route path="wellinventoryform" element={<WellInventoryForm />} />
      <Route path="waterlevelform" element={<WaterLevelForm />} />
      {lookupRoutes.map((route) => (
        <Route key={route} path={`lu_${route}`}>
          <Route index element={<LookupTableList />} />
        </Route>
      ))}
      <Route path="lu_measuring_agency">
        <Route index element={<MeasuringAgencyList />} />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
