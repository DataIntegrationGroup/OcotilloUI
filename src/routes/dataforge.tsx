import { Route, Routes } from 'react-router-dom'
import { ST2LocationList } from '@/pages/st2/locations'
import { ST2WellList } from '@/pages/st2/wells'
import { ST2DatastreamList } from '@/pages/st2/datastreams'
import { ST2SensorList } from '@/pages/st2/sensors'
import { ST2ObservedPropertiesList } from '@/pages/st2/observedProperties'
import { ST2Dashboard } from '@/pages/st2/dashboard'
import { Create, ErrorComponent } from '@refinedev/mui'
import {
  ContactEdit,
  ContactList,
  ContactShow,
} from '@/pages/dataforge/contact'
import { ContactCreate } from '@/pages/dataforge/contact/create'
import { WellCreate } from '@/pages/dataforge/thing/create'
import {
  SpringList,
  SpringCreate,
  WellEdit,
  WellList,
  WellShow,
} from '@/pages/dataforge/thing'
import { MapView } from '@/pages/dataforge/map'
import {
  LocationList,
  LocationCreate,
  LocationEdit,
  LocationShow,
} from '@/pages/dataforge/location'
import {
  GroundwaterLevelObservationCreate,
  GroundwaterLevelObservationList,
} from '@/pages/dataforge/observation'
import { GroupCreate, GroupList } from '@/pages/dataforge/group'

export const DataforgeRoutes = () => {
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
        {/*<Route path={'show/:id'} element={<WellShow />} />*/}
        {/*<Route path={'edit/:id'} element={<WellEdit />} />*/}
        <Route path={'create'} element={<SpringCreate />} />
      </Route>
      <Route path="map" element={<MapView />} />
      <Route path="location">
        <Route index element={<LocationList />} />
        <Route path={'create'} element={<LocationCreate />} />
        <Route path={'edit/:id'} element={<LocationEdit />} />
        <Route path={'show/:id'} element={<LocationShow />} />
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
        {/*<Route path={'edit/:id'} element={<GroupEdit />} />*/}
        {/*<Route path={'show/:id'} element={<GroupShow />} />*/}
      </Route>

      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
