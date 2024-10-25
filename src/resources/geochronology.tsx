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
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import Science from "@mui/icons-material/Science";
import CookieOutlined from "@mui/icons-material/CookieOutlined";

const geochronology = [
    {
        name: 'dashboard',
        list: '/geochronology/dashboard',
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined />,
        },
    },
    {name: 'principal_investigators',
        list: '/geochronology/principal_investigators',
        show: '/geochronology/principal_investigators/show/:id',
        create: '/geochronology/principal_investigators/create',
        icon: <PersonOutlined/>,
        meta: {'parent': 'geochronology',
            label: 'Principal Investigators',
            'dataProviderName': 'geochronology'}
    },
    {name: 'projects',
        list: '/geochronology/projects',
        show: '/geochronology/projects/show/:id',
        create: '/geochronology/projects/create',
        icon: <CategoryOutlined/>,
        meta: {'parent': 'geochronology',
            'dataProviderName': 'geochronology'}
    },
    {name: 'materials',
        list: '/geochronology/materials',
        show: '/geochronology/materials/show/:id',
        create: '/geochronology/materials/create',
        icon: <Science/>,

    },
    {name: 'samples',
        list: '/geochronology/samples',
        show: '/geochronology/samples/show/:id',
        create: '/geochronology/samples/create',
        icon: <CookieOutlined/>,

    },
]


export const geochronologyResources = geochronology.map((g) => {
    let meta = g.meta || {}
    meta['parent'] = 'geochronology'
    meta['dataProviderName'] = 'geochronology'

    return {
        ...g,
        meta: meta
    }
})

// ============= EOF =============================================