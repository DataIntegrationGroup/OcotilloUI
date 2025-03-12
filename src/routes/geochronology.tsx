import { Route, Routes } from "react-router-dom";
import { GeochronologyDashboard } from "@/pages/geochronology/dashboard";
import {
  PrincipalInvestigatorCreate,
  PrincipalInvestigatorList,
  PrincipalInvestigatorShow,
} from "@/pages/geochronology/principal_investigators";
import {
  ProjectCreate,
  ProjectList,
  ProjectShow,
} from "@/pages/geochronology/projects";
import {
  SampleCreate,
  SampleList,
  SampleShow,
} from "@/pages/geochronology/samples";
import {
  MaterialCreate,
  MaterialList,
  MaterialShow,
} from "@/pages/geochronology/materials";

export const GeochronologyRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<GeochronologyDashboard />} />
      <Route path="principal_investigators">
        <Route index element={<PrincipalInvestigatorList />} />
        <Route path="create" element={<PrincipalInvestigatorCreate />} />
        <Route path="show/:id" element={<PrincipalInvestigatorShow />} />
      </Route>
      <Route path="projects">
        <Route index element={<ProjectList />} />
        <Route path="create" element={<ProjectCreate />} />
        <Route path="show/:id" element={<ProjectShow />} />
      </Route>
      <Route path="samples">
        <Route index element={<SampleList />} />
        <Route path="create" element={<SampleCreate />} />
        <Route path="show/:id" element={<SampleShow />} />
      </Route>
      <Route path="materials">
        <Route index element={<MaterialList />} />
        <Route path="create" element={<MaterialCreate />} />
        <Route path="show/:id" element={<MaterialShow />} />
      </Route>
    </Routes>
  );
};
