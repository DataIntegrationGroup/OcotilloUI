import { Route, Routes } from "react-router-dom";
import { GeothermalDashboard } from "@/pages/geothermal/dashboard";
import { ErrorComponent } from "@refinedev/mui";
import {
  GeoThermalWellList,
  GeoThermalWellShow,
} from "@/pages/geothermal/wells";

export const GeothermalRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<GeothermalDashboard />} />
      <Route path="wells">
        <Route index element={<GeoThermalWellList />} />
        <Route path="show/:id" element={<GeoThermalWellShow />} />
      </Route>
      <Route path="*" element={<ErrorComponent />} />
    </Routes>
  );
};
