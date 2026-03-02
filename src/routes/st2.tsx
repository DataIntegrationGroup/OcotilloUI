import { Route, Routes } from 'react-router-dom'
import {
  ST2Dashboard,
  ST2DatastreamList,
  ST2LocationList,
  ST2ObservedPropertiesList,
  ST2SensorList,
  ST2WellList,
} from '@/pages/st2'
import { ErrorComponent } from '@refinedev/mui'

export const ST2Routes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<ST2Dashboard />} />
      <Route path="wells">
        <Route index element={<ST2WellList />} />
      </Route>
      <Route path="locations">
        <Route index element={<ST2LocationList />} />
      </Route>
      <Route path="datastreams">
        <Route index element={<ST2DatastreamList />} />
      </Route>
      <Route path="sensors">
        <Route index element={<ST2SensorList />} />
      </Route>
      <Route path="observedproperties">
        <Route index element={<ST2ObservedPropertiesList />} />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
