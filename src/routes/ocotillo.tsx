import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { Box, CircularProgress } from '@mui/material'
import { ErrorComponent } from '@refinedev/mui'
import { ProtectedRoute } from '@/components'

const RouteFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight={280}
    width="100%"
    py={6}
  >
    <CircularProgress aria-label="Loading page" />
  </Box>
)

const ContactList = lazy(() =>
  import('@/pages/ocotillo/contact/list').then((m) => ({
    default: m.ContactList,
  }))
)
const ContactShow = lazy(() =>
  import('@/pages/ocotillo/contact/show').then((m) => ({
    default: m.ContactShow,
  }))
)
const ContactEdit = lazy(() =>
  import('@/pages/ocotillo/contact/edit').then((m) => ({
    default: m.ContactEdit,
  }))
)
const ContactCreate = lazy(() =>
  import('@/pages/ocotillo/contact/create').then((m) => ({
    default: m.ContactCreate,
  }))
)

const SpringList = lazy(() =>
  import('@/pages/ocotillo/thing/list').then((m) => ({ default: m.SpringList }))
)
const SpringCreate = lazy(() =>
  import('@/pages/ocotillo/thing/create').then((m) => ({
    default: m.SpringCreate,
  }))
)
const WellCreate = lazy(() =>
  import('@/pages/ocotillo/thing/create').then((m) => ({ default: m.WellCreate }))
)
const WellEdit = lazy(() =>
  import('@/pages/ocotillo/thing/edit').then((m) => ({ default: m.WellEdit }))
)
const WellList = lazy(() =>
  import('@/pages/ocotillo/thing/list').then((m) => ({ default: m.WellList }))
)
const WellShow = lazy(() =>
  import('@/pages/ocotillo/thing/well-show').then((m) => ({
    default: m.WellShow,
  }))
)
const WellShowPdfPreview = lazy(() =>
  import('@/pages/ocotillo/thing/well-show-pdf-preview').then((m) => ({
    default: m.WellShowPdfPreview,
  }))
)
const WellBatchExport = lazy(() =>
  import('@/pages/ocotillo/thing/well-batch-export').then((m) => ({
    default: m.WellBatchExport,
  }))
)
const SpringShow = lazy(() =>
  import('@/pages/ocotillo/thing/spring-show').then((m) => ({
    default: m.SpringShow,
  }))
)

const MapView = lazy(() =>
  import('@/pages/ocotillo/map/list').then((m) => ({ default: m.MapView }))
)
const HelpPage = lazy(() =>
  import('@/pages/ocotillo/help/list').then((m) => ({ default: m.HelpPage }))
)
const CollectionsPage = lazy(() =>
  import('@/pages/ocotillo/collections/list').then((m) => ({
    default: m.CollectionsPage,
  }))
)

const LocationList = lazy(() =>
  import('@/pages/ocotillo/location/list').then((m) => ({
    default: m.LocationList,
  }))
)
const LocationCreate = lazy(() =>
  import('@/pages/ocotillo/location/create').then((m) => ({
    default: m.LocationCreate,
  }))
)
const LocationEdit = lazy(() =>
  import('@/pages/ocotillo/location/edit').then((m) => ({
    default: m.LocationEdit,
  }))
)
const LocationShow = lazy(() =>
  import('@/pages/ocotillo/location/show').then((m) => ({
    default: m.LocationShow,
  }))
)

const SensorList = lazy(() =>
  import('@/pages/ocotillo/sensor/list').then((m) => ({
    default: m.SensorList,
  }))
)
const SensorCreate = lazy(() =>
  import('@/pages/ocotillo/sensor/create').then((m) => ({
    default: m.SensorCreate,
  }))
)
const SensorEdit = lazy(() =>
  import('@/pages/ocotillo/sensor/edit').then((m) => ({
    default: m.SensorEdit,
  }))
)
const SensorShow = lazy(() =>
  import('@/pages/ocotillo/sensor/show').then((m) => ({
    default: m.SensorShow,
  }))
)

const SampleList = lazy(() =>
  import('@/pages/ocotillo/sample/list').then((m) => ({
    default: m.SampleList,
  }))
)
const SampleShow = lazy(() =>
  import('@/pages/ocotillo/sample/show').then((m) => ({
    default: m.SampleShow,
  }))
)
const SampleEdit = lazy(() =>
  import('@/pages/ocotillo/sample/edit').then((m) => ({
    default: m.SampleEdit,
  }))
)
const SampleCreate = lazy(() =>
  import('@/pages/ocotillo/sample/create').then((m) => ({
    default: m.SampleCreate,
  }))
)

const GroundwaterLevelObservationCreate = lazy(() =>
  import('@/pages/ocotillo/observation/create').then((m) => ({
    default: m.GroundwaterLevelObservationCreate,
  }))
)
const GroundwaterLevelObservationList = lazy(() =>
  import('@/pages/ocotillo/observation/list').then((m) => ({
    default: m.GroundwaterLevelObservationList,
  }))
)

const GroupCreate = lazy(() =>
  import('@/pages/ocotillo/group/create').then((m) => ({
    default: m.GroupCreate,
  }))
)
const GroupEdit = lazy(() =>
  import('@/pages/ocotillo/group/edit').then((m) => ({
    default: m.GroupEdit,
  }))
)
const GroupList = lazy(() =>
  import('@/pages/ocotillo/group/list').then((m) => ({
    default: m.GroupList,
  }))
)
const GroupShow = lazy(() =>
  import('@/pages/ocotillo/group/show').then((m) => ({
    default: m.GroupShow,
  }))
)

const AssetList = lazy(() =>
  import('@/pages/ocotillo/asset/list').then((m) => ({
    default: m.AssetList,
  }))
)
const AssetCreate = lazy(() =>
  import('@/pages/ocotillo/asset/create').then((m) => ({
    default: m.AssetCreate,
  }))
)
const AssetEdit = lazy(() =>
  import('@/pages/ocotillo/asset/edit').then((m) => ({
    default: m.AssetEdit,
  }))
)
const AssetShow = lazy(() =>
  import('@/pages/ocotillo/asset/show').then((m) => ({
    default: m.AssetShow,
  }))
)

const ThingIdLinkList = lazy(() =>
  import('@/pages/ocotillo/thing-id-link/list').then((m) => ({
    default: m.ThingIdLinkList,
  }))
)
const ThingIdLinkCreate = lazy(() =>
  import('@/pages/ocotillo/thing-id-link/create').then((m) => ({
    default: m.ThingIdLinkCreate,
  }))
)
const ThingIdLinkEdit = lazy(() =>
  import('@/pages/ocotillo/thing-id-link/edit').then((m) => ({
    default: m.ThingIdLinkEdit,
  }))
)
const ThingIdLinkShow = lazy(() =>
  import('@/pages/ocotillo/thing-id-link/show').then((m) => ({
    default: m.ThingIdLinkShow,
  }))
)

const TermCreate = lazy(() =>
  import('@/pages/ocotillo/lexicon/create').then((m) => ({
    default: m.TermCreate,
  }))
)
const TermEdit = lazy(() =>
  import('@/pages/ocotillo/lexicon/edit').then((m) => ({
    default: m.TermEdit,
  }))
)
const CategoryCreate = lazy(() =>
  import('@/pages/ocotillo/lexicon/create').then((m) => ({
    default: m.CategoryCreate,
  }))
)
const CategoryEdit = lazy(() =>
  import('@/pages/ocotillo/lexicon/edit').then((m) => ({
    default: m.CategoryEdit,
  }))
)

const GroundwaterLevelForm = lazy(() =>
  import('@/pages/ocotillo/groundwater-level-form/stepperform').then((m) => ({
    default: m.GroundwaterLevelForm,
  }))
)
const WellInventoryForm = lazy(() =>
  import('@/pages/ocotillo/well-inventory-form/index').then((m) => ({
    default: m.WellInventoryForm,
  }))
)
const LexiconList = lazy(() =>
  import('@/pages/ocotillo/lexicon/list').then((m) => ({
    default: m.LexiconList,
  }))
)
const WaterChemistryApp = lazy(() =>
  import('@/pages/ocotillo/water-chemistry-app/index').then((m) => ({
    default: m.WaterChemistryApp,
  }))
)
const HydrographCorrectionPage = lazy(() =>
  import('@/pages/ocotillo/hydrograph-correction/index').then((m) => ({
    default: m.HydrographCorrectionPage,
  }))
)

const WellScreenCreate = lazy(() =>
  import('@/pages/ocotillo/well-screen/create').then((m) => ({
    default: m.WellScreenCreate,
  }))
)
const WellScreenEdit = lazy(() =>
  import('@/pages/ocotillo/well-screen/edit').then((m) => ({
    default: m.WellScreenEdit,
  }))
)
const WellScreenList = lazy(() =>
  import('@/pages/ocotillo/well-screen/list').then((m) => ({
    default: m.WellScreenList,
  }))
)
const WellScreenShow = lazy(() =>
  import('@/pages/ocotillo/well-screen/show').then((m) => ({
    default: m.WellScreenShow,
  }))
)

export const OcotilloRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="contact">
          <Route index element={<ContactList />} />
          <Route path={'show/:id'} element={<ContactShow />} />
          <Route path={'edit/:id'} element={<ContactEdit />} />
          <Route path={'create'} element={<ContactCreate />} />
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
          <Route path={'show/:id'} element={<WellShow />} />
          <Route
            path={'pdf-preview/:id'}
            element={
              <ProtectedRoute resource="ocotillo.thing-well-pdf-preview">
                <WellShowPdfPreview />
              </ProtectedRoute>
            }
          />
          <Route path={'edit/:id'} element={<WellEdit />} />
          <Route path={'create'} element={<WellCreate />} />
        </Route>
        <Route path="spring">
          <Route index element={<SpringList />} />
          <Route path={'show/:id'} element={<SpringShow />} />
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
        <Route path="help" element={<HelpPage />} />
        <Route path="location">
          <Route index element={<LocationList />} />
          <Route path={'create'} element={<LocationCreate />} />
          <Route path={'edit/:id'} element={<LocationEdit />} />
          <Route path={'show/:id'} element={<LocationShow />} />
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
        </Route>
        <Route path="group">
          <Route index element={<GroupList />} />
          <Route path={'create'} element={<GroupCreate />} />
          <Route path={'edit/:id'} element={<GroupEdit />} />
          <Route path={'show/:id'} element={<GroupShow />} />
        </Route>
        <Route path="asset">
          <Route index element={<AssetList />} />
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
        <Route path={'water-chemistry-import'}>
          <Route index element={<WaterChemistryApp />} />
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
        <Route path="groundwater-level-form">
          <Route index element={<GroundwaterLevelForm />} />
        </Route>
        <Route path="well-inventory-form" element={<WellInventoryForm />} />
        <Route path="*" element={<ErrorComponent />} />
      </Routes>
    </Suspense>
  )
}
