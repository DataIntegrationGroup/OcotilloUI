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
import { ProtectedRoute } from '@/components'

const lookupRoutes = [
  'measurement_method',
  'level_status',
  'data_quality',
  'data_source',
]

export const AMPRoutes = () => {
  return (
    <Routes>
      <Route
        path="hydrographcorrector"
        element={
          <ProtectedRoute resource="water.hydrographcorrector">
            <HydrographCorrector />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute resource="water.dashboard">
            <WaterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="querybuilder"
        element={
          <ProtectedRoute resource="water.querybuilder">
            <Querybuilder />
          </ProtectedRoute>
        }
      />
      {/* Removed until it is in WIP state */}
      {/* <Route path="reportbuilder" element={<ReportBuilder />} /> */}
      <Route
        path="chemupload"
        element={
          <ProtectedRoute resource="water.chemupload">
            <ChemUpload />
          </ProtectedRoute>
        }
      />
      <Route path="wells">
        <Route
          index
          element={
            <ProtectedRoute resource="water.wells">
              <WellList />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute resource="water.wells">
              <WellEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="show/:id"
          element={
            <ProtectedRoute resource="water.wells">
              <WellShow />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="locations">
        <Route
          index
          element={
            <ProtectedRoute resource="water.locations">
              <LocationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute resource="water.locations">
              <LocationCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute resource="water.locations">
              <LocationEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="show/:id"
          element={
            <ProtectedRoute resource="water.locations">
              <LocationShow />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="equipment">
        <Route
          index
          element={
            <ProtectedRoute resource="water.equipment">
              <EquipmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="show/:id"
          element={
            <ProtectedRoute resource="water.equipment">
              <EquipmentShow />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="manualwaterlevels">
        <Route
          index
          element={
            <ProtectedRoute resource="water.manual_waterlevels">
              <ManualWaterLevelList />
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute resource="water.manual_waterlevels">
              <ManualWaterLevelsCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute resource="water.manual_waterlevels">
              <ManualWaterLevelsEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="show/:id"
          element={
            <ProtectedRoute resource="water.manual_waterlevels">
              <ManualWaterLevelShow />
            </ProtectedRoute>
          }
        />
        <Route
          path="batchupload"
          element={
            <ProtectedRoute resource="water.manualwaterlevels_batchupload">
              <ManualWaterLevelsBatchUpload />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="projects">
        <Route
          index
          element={
            <ProtectedRoute resource="water.projects">
              <AMPProjectList />
            </ProtectedRoute>
          }
        />
        <Route
          path="show/:id"
          element={
            <ProtectedRoute resource="water.projects">
              <ProjectShow />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="wellinventoryform"
        element={
          <ProtectedRoute resource="water.wellinventoryform">
            <WellInventoryForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="waterlevelform"
        element={
          <ProtectedRoute resource="water.waterlevelform">
            <WaterLevelForm />
          </ProtectedRoute>
        }
      />
      {lookupRoutes.map((route) => (
        <Route key={route} path={`lu_${route}`}>
          <Route
            index
            element={
              <ProtectedRoute resource={`water.${route}`}>
                <LookupTableList />
              </ProtectedRoute>
            }
          />
        </Route>
      ))}
      <Route path="lu_measuring_agency">
        <Route
          index
          element={
            <ProtectedRoute resource="water.measuring_agency">
              <MeasuringAgencyList />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
