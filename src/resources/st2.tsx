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

import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import Construction from "@mui/icons-material/Construction";
import Place from "@mui/icons-material/Place";
import Plumbing from "@mui/icons-material/Plumbing";
import Cable from "@mui/icons-material/Cable";
import Water from "@mui/icons-material/Water";
import TableViewIcon from "@mui/icons-material/TableView";
import ScienceOutlined from "@mui/icons-material/ScienceOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import {WaterDrop, WaterOutlined} from "@mui/icons-material";
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';

let st2 = [
    {
        name: 'dashboard',
        list: '/st2/dashboard',
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined />,
        },
    },
    {
        name: 'querybuilder',
        list: '/st2/querybuilder',
        meta: {
            label: "Query Builder",
            icon: <Construction />,
        },
    },
    {
        name: "locations",
        icon: <Place/>,
        list: "/st2/locations",
        // edit: "/st2/locations/edit/:id",
        // show: "/st2/locations/show/:id",
        // create: "/st2/locations/create",
    },
    {
        name: "wells",
        icon: <Plumbing/>,
        list: "/st2/wells",
        // edit: "/st2/wells/edit/:id",
        // show: "/st2/wells/show/:id",
        // create: "/st2/wells/create",
    },
    {
        name: "datastreams",
        icon: <WaterOutlined/>,
        list: "/st2/datastreams",
        // edit: "/st2/datastreams/edit/:id",
        // show: "/st2/datastreams/show/:id",
        // create: "/st2/datastreams/create",
    },
    {
        name: "sensors",
        icon: <SensorsOutlinedIcon/>,
        list: "/st2/sensors",
    },
    {
        name: "observedproperties",
        list: "/st2/observedproperties",
        meta: {
            label: "ObservedProperties",
            icon: <BiotechOutlinedIcon />,
        },
    }
]

export const st2Resources = st2.map((b) => {

    let meta = b.meta || {}
    if (!meta['parent']){
        meta['parent'] = 'st2'
    }
    meta['dataProviderName'] = 'st2'
    return {
        ...b,
        meta: meta
    }
})

// ============= EOF =============================================