import { ErrorComponent } from '@refinedev/mui'
import { Route, Routes } from 'react-router'
import { ProtectedRoute } from '@/components'
import {
  AssetCreate,
  AssetEdit,
  AssetList,
  AssetShow,
  UnassociatedAssetList,
} from '@/pages/ocotillo/asset'
import { ChemistryReportExport } from '@/pages/ocotillo/chemistry-report'
import { CollectionsPage } from '@/pages/ocotillo/collections'
import { ContactList, ContactShow } from '@/pages/ocotillo/contact'
import { GroundwaterLevelForm } from '@/pages/ocotillo/groundwater-level-form/stepperform'
import {
  GroupCreate,
  GroupEdit,
  GroupList,
  GroupShow,
} from '@/pages/ocotillo/group'
import { HydrographCorrectionPage } from '@/pages/ocotillo/hydrograph-correction'
import {
  CategoryCreate,
  CategoryEdit,
  LexiconList,
  TermCreate,
  TermEdit,
} from '@/pages/ocotillo/lexicon'
import {
  LocationCreate,
  LocationEdit,
  LocationList,
  LocationShow,
} from '@/pages/ocotillo/location'
import { MapView } from '@/pages/ocotillo/map'
import {
  GroundwaterLevelObservationCreate,
  GroundwaterLevelObservationList,
} from '@/pages/ocotillo/observation'
import {
  SampleCreate,
  SampleEdit,
  SampleList,
  SampleShow,
} from '@/pages/ocotillo/sample'
import {
  SensorCreate,
  SensorEdit,
  SensorList,
  SensorShow,
} from '@/pages/ocotillo/sensor'
import {
  SpringCreate,
  SpringList,
  SpringShow,
  WellBatchExport,
  WellCreate,
  WellList,
  WellProjectList,
  WellProjectShow,
  WellShow,
  WellShowPdfPreview,
} from '@/pages/ocotillo/thing'
import {
  ThingIdLinkCreate,
  ThingIdLinkEdit,
  ThingIdLinkList,
  ThingIdLinkShow,
} from '@/pages/ocotillo/thing-id-link'
import { WaterChemistryApp } from '@/pages/ocotillo/water-chemistry-app'
import { WellInventoryForm } from '@/pages/ocotillo/well-inventory-form'
import {
  WellScreenCreate,
  WellScreenEdit,
  WellScreenList,
  WellScreenShow,
} from '@/pages/ocotillo/well-screen'

export const OcotilloRoutes = () => {
  return (
    <Routes>
      <Route path="contact">
        <Route index element={<ContactList />} />
        <Route path={'show/:id'} element={<ContactShow />} />
      </Route>
      <Route path="well">
        <Route index element={<WellList />} />
        <Route
          path={'batch-export'}
          element={
            <ProtectedRoute resource="ocotillo.thing-well-batch-export">
              <WellBatchExport />
            </ProtectedRoute>
          }
        />
        <Route path={'projects'}>
          <Route
            index
            element={
              <ProtectedRoute resource="ocotillo.thing-well-projects">
                <WellProjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path={'show/:id'}
            element={
              <ProtectedRoute resource="ocotillo.thing-well-projects">
                <WellProjectShow />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path={'show/:id'} element={<WellShow />} />
        <Route
          path={'pdf-preview/:id'}
          element={
            <ProtectedRoute resource="ocotillo.thing-well-pdf-preview">
              <WellShowPdfPreview />
            </ProtectedRoute>
          }
        />
        <Route path={'create'} element={<WellCreate />} />
      </Route>
      <Route path="spring">
        <Route index element={<SpringList />} />
        <Route path={'show/:id'} element={<SpringShow />} />
        {/* <Route path={'edit/:id'} element={<ThingEdit />} /> */}
        <Route path={'create'} element={<SpringCreate />} />
      </Route>
      <Route path={'thing-id-link'}>
        <Route index element={<ThingIdLinkList />} />
        <Route path={'create'} element={<ThingIdLinkCreate />} />
        <Route path={'edit/:id'} element={<ThingIdLinkEdit />} />
        <Route path={'show/:id'} element={<ThingIdLinkShow />} />
      </Route>
      <Route path={'well-screen'}>
        <Route index element={<WellScreenList />} />
        <Route path={'create'} element={<WellScreenCreate />} />
        <Route path={'edit/:id'} element={<WellScreenEdit />} />
        <Route path={'show/:id'} element={<WellScreenShow />} />
      </Route>
      <Route path="map" element={<MapView />} />
      <Route path="collections" element={<CollectionsPage />} />
      <Route path="location">
        <Route
          index
          element={
            <ProtectedRoute resource="ocotillo.location">
              <LocationList />
            </ProtectedRoute>
          }
        />
        <Route
          path={'create'}
          element={
            <ProtectedRoute resource="ocotillo.location" action="create">
              <LocationCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path={'edit/:id'}
          element={
            <ProtectedRoute resource="ocotillo.location" action="edit">
              <LocationEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path={'show/:id'}
          element={
            <ProtectedRoute resource="ocotillo.location" action="show">
              <LocationShow />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="sensor">
        <Route index element={<SensorList />} />
        <Route path={'create'} element={<SensorCreate />} />
        <Route path={'edit/:id'} element={<SensorEdit />} />
        <Route path={'show/:id'} element={<SensorShow />} />
      </Route>
      <Route path="sample">
        <Route index element={<SampleList />} />
        <Route path={'show/:id'} element={<SampleShow />} />
        <Route path={'edit/:id'} element={<SampleEdit />} />
        <Route path={'create'} element={<SampleCreate />} />
      </Route>
      <Route path="groundwater-level-observation">
        <Route index element={<GroundwaterLevelObservationList />} />
        <Route
          path={'create'}
          element={<GroundwaterLevelObservationCreate />}
        />
        {/*<Route path={'edit/:id'} element={<ObservationEdit />} />*/}
        {/*<Route path={'show/:id'} element={<ObservationShow />} />*/}
      </Route>
      <Route path="group">
        <Route index element={<GroupList />} />
        <Route path={'create'} element={<GroupCreate />} />
        <Route path={'edit/:id'} element={<GroupEdit />} />
        <Route path={'show/:id'} element={<GroupShow />} />
      </Route>
      <Route path="asset">
        <Route index element={<AssetList />} />
        <Route
          path={'unassociated'}
          element={
            <ProtectedRoute
              resource="ocotillo.asset-unassociated"
              action="manage"
            >
              <UnassociatedAssetList />
            </ProtectedRoute>
          }
        />
        <Route path={'create'} element={<AssetCreate />} />
        <Route path={'edit/:id'} element={<AssetEdit />} />
        <Route path={'show/:id'} element={<AssetShow />} />
      </Route>
      <Route path="lexicon">
        <Route
          index
          element={
            <ProtectedRoute resource="ocotillo.lexicon">
              <LexiconList />
            </ProtectedRoute>
          }
        />
        <Route
          path={'term/create'}
          element={
            <ProtectedRoute resource="ocotillo.lexicon" action="create">
              <TermCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path={'term/edit/:id'}
          element={
            <ProtectedRoute resource="ocotillo.lexicon" action="edit">
              <TermEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path={'category/create'}
          element={
            <ProtectedRoute resource="ocotillo.lexicon" action="create">
              <CategoryCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path={'category/edit/:id'}
          element={
            <ProtectedRoute resource="ocotillo.lexicon" action="edit">
              <CategoryEdit />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Apps */}
      <Route path={'water-chemistry-import'}>
        <Route index element={<WaterChemistryApp />} />
      </Route>
      <Route path={'chemistry-report'}>
        <Route
          index
          element={
            <ProtectedRoute resource="ocotillo.chemistry-report">
              <ChemistryReportExport />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path={'hydrograph-correction'}>
        <Route
          index
          element={
            <ProtectedRoute resource="ocotillo.hydrograph-correction">
              <HydrographCorrectionPage />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* Forms */}
      <Route path="groundwater-level-form">
        <Route index element={<GroundwaterLevelForm />} />
      </Route>
      <Route path="well-inventory-form" element={<WellInventoryForm />} />
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
