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
import TableViewIcon from '@mui/icons-material/TableView';
import Place from '@mui/icons-material/Place';
import Plumbing from '@mui/icons-material/Plumbing';
import Cable from '@mui/icons-material/Cable';
import Water from '@mui/icons-material/Water';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import CookieOutlined from '@mui/icons-material/CookieOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AccessTime from '@mui/icons-material/AccessTime';
import Diamond from '@mui/icons-material/Diamond';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import Construction from '@mui/icons-material/Construction';
import Science from '@mui/icons-material/Science';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';

let base = [{name: 'Water',
            icon: <WaterDropOutlined/>,
            meta: {
                label: 'Water',
            }
            },
            {
                name: 'geochronology',
                meta: {label: 'Geochronology'},
                icon: <AccessTime/>
            },
            // {name: 'Critical Mineral',
            // icon: <Cable/>},
]

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
        name: 'querybuilder',
        list: '/amp/querybuilder',
        meta: {
            label: "Query Builder",
            icon: <Construction />,
        },
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
        icon: <Water/>,
        meta: {
            label: "Manual Water Levels",
        }
    },
    {
        name: 'LookupTables',
        icon: <TableViewIcon/>,
        meta: {
            label: "Lookup Tables",
        }
    }

]

const ampResources = amp.map((b) => {

    let meta = b.meta || {}
    meta['parent'] = 'Water'
    meta['dataProviderName'] = 'amp'
    return {
        ...b,
        meta: meta
    }
})

let lookupKeys = ['level_status', 'measurement_method', 'data_quality', 'measuring_agency', 'data_source']

let lookup = lookupKeys.map((l) => {
    return {
        name: l,
        list: `/amp/lu_${l}`,
        meta: {
            parent: 'LookupTables'
        }
    }
})

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


const geochronologyResources = geochronology.map((g) => {
    let meta = g.meta || {}
    meta['parent'] = 'geochronology'
    meta['dataProviderName'] = 'geochronology'

    return {
        ...g,
        meta: meta
    }
})



let criticalMineral = [
    {
        name: 'criticalmineral',
        list: '/criticalmineral',
        icon: <DiamondOutlined />,
        meta: {
            label: "Critical Minerals",
            }
    }
]

export const resources = [...base, ...ampResources, ...lookup, ...geochronologyResources, ...criticalMineral]

// ============= EOF =============================================