import { Route, Routes } from "react-router-dom";
import { ST2LocationList } from "@/pages/st2/locations";
import { ST2WellList } from "@/pages/st2/wells";
import { ST2DatastreamList } from "@/pages/st2/datastreams";
import { ST2SensorList } from "@/pages/st2/sensors";
import { ST2ObservedPropertiesList } from "@/pages/st2/observedProperties";
import { ST2Dashboard } from "@/pages/st2/dashboard";
import { ErrorComponent } from "@refinedev/mui";

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
  );
};
