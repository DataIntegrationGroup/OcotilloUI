// ===============================================================================
// Author:  Jake Ross
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// ===============================================================================

import {Route, Routes} from "react-router-dom";
import {MapsDashboard} from "@/pages/maps/dashboard";

export const MapsRoutes = () => {
    return (
        <Routes>
            <Route path="dashboard" element={<MapsDashboard/>}/>
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