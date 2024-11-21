// ===============================================================================
// Copyright 2024 Jake Ross
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
import {WaterDashboard} from "@/pages/amp/dashboard";
import {Querybuilder} from "@/pages/amp/querybuilder";
import {ReportBuilder} from "@/pages/amp/reportbuilder";
import {ChemUpload} from "@/pages/amp/chemupload";
import {WellEdit, WellList, WellShow} from "@/pages/amp/wells";
import {LocationCreate, LocationEdit, LocationList, LocationShow} from "@/pages/amp/locations";
import {ST2LocationList} from "@/pages/st2/locations";
import {ST2WellList} from "@/pages/st2/wells";
import {ST2DatastreamList} from "@/pages/st2/datastreams";

export const makeST2Routes = () => {

    return (
        <Route path={'/st2'}>
            {/*<Route path="dashboard" element={<WaterDashboard/>}/>*/}
            {/*<Route path='reportbuilder' element={<ReportBuilder/>}/>*/}
            <Route path="wells">
                <Route index element={<ST2WellList/>}/>
                {/*<Route path="create" element={<PostCreate />} />*/}
                {/*<Route path="edit/:id" element={<WellEdit/>}/>*/}
                {/*<Route path="show/:id" element={<WellShow/>}/>*/}
            </Route>
            <Route path="locations">
                <Route index element={<ST2LocationList/>}/>
                {/*<Route path="create" element={<LocationCreate/>}/>*/}
                {/*<Route path="edit/:id" element={<LocationEdit/>}/>*/}
                {/*<Route path="show/:id" element={<LocationShow/>}/>*/}
            </Route>
            <Route path="datastreams">
                <Route index element={<ST2DatastreamList/>}/>
                {/*<Route path="create" element={<LocationCreate/>}/>*/}
                {/*<Route path="edit/:id" element={<LocationEdit/>}/>*/}
                {/*<Route path="show/:id" element={<LocationShow/>}/>*/}
            </Route>
        </Route>
    )
}
// ============= EOF =============================================