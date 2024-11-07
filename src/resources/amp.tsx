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

let amp = [
    {
        name: 'dashboard',
        list: '/amp/dashboard',
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined />,
        },
    },
    {
        name: 'reportbuilder',
        list: '/amp/reportbuilder',
        meta: {
            label: "Report Builder",
            icon: <Construction />,
        },
    },
    {
        name: 'querybuilder',
        list: '/amp/querybuilder',
        meta: {
            label: "Query Builder",
            icon: <Construction />,
        },
    },
    {
        name: 'projects',
        list: '/amp/projects',
        icon: <CategoryOutlined/>,
    },

    {
        name: "locations",
        icon: <Place/>,
        list: "/amp/locations",
        edit: "/amp/locations/edit/:id",
        show: "/amp/locations/show/:id",
        create: "/amp/locations/create",
    },
    {
        name: "wells",
        icon: <Plumbing/>,
        list: "/amp/wells",
        edit: "/amp/wells/edit/:id",
        show: "/amp/wells/show/:id",
        create: "/amp/wells/create",
    },
    {
        name: 'equipment',
        icon: <Cable/>,
        list: "/amp/equipment",
        edit: "/amp/equipment/edit/:id",
        create: "/amp/equipment/create",
        show: "/amp/equipment/show/:id",
    },
    {
        name: 'manualwaterlevels',
        list: '/amp/manualwaterlevels',
        edit: '/amp/manualwaterlevels/edit/:id',
        create: '/amp/manualwaterlevels/create',
        show: '/amp/manualwaterlevels/show/:id',
        meta: {
            label: "Manual Water Levels",
        }
    },


    // batch upload
    {
        name: 'batchupload',
        icon: <FileUploadOutlined/>,
        meta: {
            label: "Batch Upload"
        }
    },

    {   name: 'chemupload',
        list: '/amp/chemupload',
        icon: <ScienceOutlined/>,
        meta: {parent: 'batchupload',
            nestedLevel: 2}
    },
    {
        name: 'manualwaterlevels_batchupload',
        list: '/amp/manualwaterlevels/batchupload',
        icon: <Water/>,
        meta: {
            label: "Manual Water Levels",
            parent: "batchupload",
            nestedLevel: 2
        }
    },
    // chemistry
    {name: 'Chemistry',
        icon: <ScienceOutlined/>,
        meta: {
            label: "Chemistry"}
    },

    // lookup tables
    {
        name: 'LookupTables',
        icon: <TableViewIcon/>,
        meta: {
            label: "Lookup Tables",
        }
    },

]

export const ampResources = amp.map((b) => {

    let meta = b.meta || {}
    if (!meta['parent']){
        meta['parent'] = 'Water'
    }
    meta['dataProviderName'] = 'amp'
    return {
        ...b,
        meta: meta
    }
})

const lookupKeys = ['level_status', 'measurement_method', 'data_quality', 'measuring_agency', 'data_source']

export const lookup = lookupKeys.map((l) => {
    return {
        name: l,
        list: `/amp/lu_${l}`,
        meta: {
            parent: 'LookupTables',
            nestedLevel: 2,
        }
    }
})
// ============= EOF =============================================