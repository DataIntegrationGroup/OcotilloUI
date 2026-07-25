import { Route, Routes } from 'react-router'
import { ErrorComponent } from '@refinedev/mui'
import {
  GeothermalDashboard,
  GeoThermalWellList,
  GeoThermalWellShow,
  GeoThermalRecordsGrid,
  GeoThermalRecordsGridPicker,
  GeoThermalWellInventory,
} from '@/pages/geothermal'

export const GeothermalRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<GeothermalDashboard />} />
      <Route path="wells">
        <Route index element={<GeoThermalWellList />} />
        <Route path="show/:id" element={<GeoThermalWellShow />} />
        <Route path="records-grid" element={<GeoThermalRecordsGridPicker />} />
        <Route path="records-grid/:id" element={<GeoThermalRecordsGrid />} />
        <Route path="inventory" element={<GeoThermalWellInventory />} />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  )
}
