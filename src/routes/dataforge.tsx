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
  SensorList,
  SensorCreate,
  SensorEdit,
  SensorShow,
} from '@/pages/dataforge/sensor'
import {
  SampleList,
  SampleShow,
} from '@/pages/dataforge/sample'

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
      <Route path="sensor">
        <Route index element={<SensorList />} />
        <Route path={'create'} element={<SensorCreate />} />
        <Route path={'edit/:id'} element={<SensorEdit />} />
        <Route path={'show/:id'} element={<SensorShow />} />
      </Route>
      <Route path="sample">
        <Route index element={<SampleList />} />
        <Route path={'show/:id'} element={<SampleShow />} />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
