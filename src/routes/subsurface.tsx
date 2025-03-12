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

import {Route, Routes} from "react-router-dom";
import {GeothermalDashboard} from "@/pages/geothermal/dashboard";
import {GeoThermalWellList, GeoThermalWellShow} from "@/pages/geothermal/wells";
import {SubsurfaceDashboard} from "@/pages/subsurface/dashboard";

export const SubsurfaceRoutes = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<SubsurfaceDashboard/>}/>
            {/*<Route path="wells">*/}
            {/*    <Route index element={<GeoThermalWellList/>}/>*/}
            {/*    /!*<Route path="create" element={<GeoThermalCreate/>}/>*!/*/}
            {/*    /!*    <Route path="edit/:id" element={<SampleEdit/>}/>*!/*/}
            {/*    <Route path="show/:id" element={<GeoThermalWellShow/>}/>*/}
            {/*</Route>*/}

        </Routes>

    )
}
// ============= EOF =============================================