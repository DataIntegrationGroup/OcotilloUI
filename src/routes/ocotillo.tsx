import { Route, Routes } from 'react-router-dom'
import { ErrorComponent } from '@refinedev/mui'
import { ContactEdit, ContactList, ContactShow } from '@/pages/ocotillo/contact'
import { ContactCreate } from '@/pages/ocotillo/contact/create'
import { WellCreate } from '@/pages/ocotillo/thing/create'
import {
  SpringList,
  SpringCreate,
  WellEdit,
  WellList,
  WellShow,
  SpringShow,
} from '@/pages/ocotillo/thing'
import { MapView } from '@/pages/ocotillo/map'
import {
  LocationList,
  LocationCreate,
  LocationEdit,
  LocationShow,
} from '@/pages/ocotillo/location'
import {
  SensorList,
  SensorCreate,
  SensorEdit,
  SensorShow,
} from '@/pages/ocotillo/sensor'
import {
  SampleList,
  SampleShow,
  SampleEdit,
  SampleCreate,
} from '@/pages/ocotillo/sample'
import {
  GroundwaterLevelObservationCreate,
  GroundwaterLevelObservationList,
} from '@/pages/ocotillo/observation'
import {
  GroupCreate,
  GroupEdit,
  GroupList,
  GroupShow,
} from '@/pages/ocotillo/group'
import {
  AssetList,
  AssetCreate,
  AssetEdit,
  AssetShow,
} from '@/pages/ocotillo/asset'
// import { GroundwaterLevelForm } from '@/pages/dataforge/groundwaterlevelform'
import { GroundwaterLevelForm } from '@/pages/ocotillo/groundwater-level-form/stepperform'
import { WellInventoryForm } from '@/pages/ocotillo/well-inventory-form'
import { LexiconList } from '@/pages/ocotillo/lexicon'
import { WaterChemistryApp } from '@/pages/ocotillo/water-chemistry-app'

export const OcotilloRoutes = () => {
  return (
    <Routes>
      {/*<Route path="dashboard" element={<ST2Dashboard />} />*/}
      <Route path="contact">
        <Route index element={<ContactList />} />
        <Route path={'show/:id'} element={<ContactShow />} />
        <Route path={'edit/:id'} element={<ContactEdit />} />
        <Route path={'create'} element={<ContactCreate />} />
      </Route>
      <Route path="well">
        <Route index element={<WellList />} />
        <Route path={'show/:id'} element={<WellShow />} />
        <Route path={'edit/:id'} element={<WellEdit />} />
        <Route path={'create'} element={<WellCreate />} />
      </Route>
      <Route path="spring">
        <Route index element={<SpringList />} />
        <Route path={'show/:id'} element={<SpringShow />} />
        {/* <Route path={'edit/:id'} element={<ThingEdit />} /> */}
        <Route path={'create'} element={<SpringCreate />} />
      </Route>
      <Route path="map" element={<MapView />} />
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
        <Route path={'create'} element={<AssetCreate />} />
        <Route path={'edit/:id'} element={<AssetEdit />} />
        <Route path={'show/:id'} element={<AssetShow />} />
      </Route>
      <Route path="lexicon">
        <Route index element={<LexiconList />} />
        {/* Add your lexicon list content here */}
      </Route>
      // Apps
      <Route path={'water-chemistry-import'}>
        <Route index element={<WaterChemistryApp />} />
      </Route>
      // Forms
      <Route path="groundwater-level-form">
        <Route index element={<GroundwaterLevelForm />} />
      </Route>
      <Route path="well-inventory-form" element={<WellInventoryForm />} />
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
