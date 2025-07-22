import { Route, Routes } from 'react-router-dom'
import { ST2LocationList } from '@/pages/st2/locations'
import { ST2WellList } from '@/pages/st2/wells'
import { ST2DatastreamList } from '@/pages/st2/datastreams'
import { ST2SensorList } from '@/pages/st2/sensors'
import { ST2ObservedPropertiesList } from '@/pages/st2/observedProperties'
import { ST2Dashboard } from '@/pages/st2/dashboard'
import { ErrorComponent } from '@refinedev/mui'
import {
  ContactEdit,
  ContactList,
  ContactShow,
} from '@/pages/dataforge/contact'
import { ContactCreate } from '@/pages/dataforge/contact/create'

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

      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
