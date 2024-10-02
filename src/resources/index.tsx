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
        list: '/dashboard',
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined />,
        },
    },
    {
        name: 'querybuilder',
        list: '/querybuilder',
        meta: {
            label: "Query Builder",
            icon: <Construction />,
        },
    },
    {
        name: "locations",
        icon: <Place/>,
        list: "/locations",
        edit: "/locations/edit/:id",
        show: "/locations/show/:id",
        create: "/locations/create",
    },
    {
        name: "wells",
        icon: <Plumbing/>,
        list: "/wells",
        edit: "/wells/edit/:id",
        show: "/wells/show/:id",
        create: "/wells/create",
    },
    {
        name: 'equipment',
        icon: <Cable/>,
        list: "/equipment",
        edit: "/equipment/edit/:id",
        create: "/equipment/create",
        show: "/equipment/show/:id",
    },
    {
        name: 'manualwaterlevels',
        list: '/manualwaterlevels',
        edit: '/manualwaterlevels/edit/:id',
        create: '/manualwaterlevels/create',
        show: '/manualwaterlevels/show/:id',
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
        list: `/lu_${l}`,
        meta: {
            parent: 'LookupTables'
        }
    }
})

const geochronology = [
    {name: 'projects',
        list: '/geochronology/projects',
        icon: <CategoryOutlined/>,
        meta: {'parent': 'geochronology',
                'dataProviderName': 'geochronology'}
    },
    {name: 'samples',
        list: '/geochronology/samples',
        icon: <ScienceOutlined/>,

    },
    {name: 'materials',
        list: '/geochronology/materials',
        icon: <Science/>,

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