// ===============================================================================
// Copyright 2025 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================

import {Route} from "react-router-dom";
import {GeochronologyDashboard} from "@/pages/geochronology/dashboard";
import {
    PrincipalInvestigatorCreate,
    PrincipalInvestigatorList,
    PrincipalInvestigatorShow
} from "@/pages/geochronology/principal_investigators";
import {ProjectCreate, ProjectList, ProjectShow} from "@/pages/geochronology/projects";
import {SampleCreate, SampleList, SampleShow} from "@/pages/geochronology/samples";
import {MaterialCreate, MaterialList, MaterialShow} from "@/pages/geochronology/materials";

export const makeGeochronologyRoutes = () => {
    return (
        <Route path="/geochronology">
            <Route path="dashboard" element={<GeochronologyDashboard/>}/>
            <Route path="principal_investigators">
                <Route index element={<PrincipalInvestigatorList/>}/>
                <Route path="create" element={<PrincipalInvestigatorCreate/>}/>
                {/*<Route path="edit/:id" element={<LocationEdit/>}/>*/}
                <Route path="show/:id" element={<PrincipalInvestigatorShow/>}/>
            </Route>
            <Route path="projects">
                <Route index element={<ProjectList/>}/>
                <Route path="create" element={<ProjectCreate/>}/>
                {/*<Route path="edit/:id" element={<ProjectEdit/>}/>*/}
                <Route path="show/:id" element={<ProjectShow/>}/>
            </Route>
            <Route path="samples">
                <Route index element={<SampleList/>}/>
                <Route path="create" element={<SampleCreate/>}/>
                {/*    <Route path="edit/:id" element={<SampleEdit/>}/>*/}
                <Route path="show/:id" element={<SampleShow/>}/>
            </Route>
            <Route path='materials'>
                <Route index element={<MaterialList/>}/>
                <Route path="create" element={<MaterialCreate/>}/>
                {/*<Route path="edit/:id" element={<MaterialEdit/>}/>*/}
                <Route path="show/:id" element={<MaterialShow/>}/>
            </Route>
        </Route>
    )
}
// ============= EOF =============================================