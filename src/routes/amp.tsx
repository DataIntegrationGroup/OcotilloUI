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
import {EquipmentList, EquipmentShow} from "@/pages/amp/equipment";
import {
    ManualWaterLevelList,
    ManualWaterLevelsCreate,
    ManualWaterLevelsEdit,
    ManualWaterLevelShow
} from "@/pages/amp/manualwaterlevels";
import ManualWaterLevelsBatchUpload from "@/pages/amp/manualwaterlevels/batchupload";
import {AMPProjectList} from "@/pages/amp/projects";
import {ProjectShow} from "@/pages/geochronology/projects";
import {LookupTableList, MeasuringAgencyList} from "@/components/lookuptable";
import {WellInventoryForm} from "@/pages/amp/wellinventoryform";
import {HydrographCorrector} from "@/pages/amp/hydrographcorrector";

const lookupRoutes = [
    "measurement_method",
    "level_status",
    "data_quality",
    "data_source",
];


export const makeAMPRoutes = () => {
    return (
        <Route path="/amp">
            <Route path={"hydrographcorrector"} element={<HydrographCorrector/>}/>
            <Route path="dashboard" element={<WaterDashboard/>}/>
            <Route path="querybuilder" element={<Querybuilder/>}/>
            <Route path='reportbuilder' element={<ReportBuilder/>}/>
            <Route path="chemupload" element={<ChemUpload/>}/>
            <Route path="wells">
                <Route index element={<WellList/>}/>
                {/*<Route path="create" element={<PostCreate />} />*/}
                <Route path="edit/:id" element={<WellEdit/>}/>
                <Route path="show/:id" element={<WellShow/>}/>
            </Route>
            <Route path="locations">
                <Route index element={<LocationList/>}/>
                <Route path="create" element={<LocationCreate/>}/>
                <Route path="edit/:id" element={<LocationEdit/>}/>
                <Route path="show/:id" element={<LocationShow/>}/>
            </Route>
            <Route path="equipment">
                <Route index element={<EquipmentList/>}/>
                <Route path="show/:id" element={<EquipmentShow/>}/>
            </Route>
            <Route path="manualwaterlevels">
                <Route index element={<ManualWaterLevelList/>}/>
                <Route path="create" element={<ManualWaterLevelsCreate/>}/>
                <Route path="edit/:id" element={<ManualWaterLevelsEdit/>}/>
                <Route path="show/:id" element={<ManualWaterLevelShow/>}/>
                <Route path="batchupload" element={<ManualWaterLevelsBatchUpload/>}/>
            </Route>
            <Route path='projects'>
                <Route index element={<AMPProjectList/>}/>
                {/*<Route path="create" element={<ProjectCreate/>}/>*/}
                {/*<Route path="edit/:id" element={<ProjectEdit/>}/>*/}
                <Route path="show/:id" element={<ProjectShow/>}/>
            </Route>
            <Route path={'wellinventoryform'} element={<WellInventoryForm/>}/>

            {lookupRoutes.map((route) => (
                <Route key={route} path={`lu_${route}`}>
                    <Route index element={<LookupTableList/>}/>
                </Route>
            ))}
            <Route path={`lu_measuring_agency`}>
                <Route index element={<MeasuringAgencyList/>}/>
            </Route>
        </Route>
    )
}
// ============= EOF =============================================