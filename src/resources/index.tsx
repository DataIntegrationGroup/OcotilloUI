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

import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import AccessTime from '@mui/icons-material/AccessTime';
import HeatPumpOutlined from '@mui/icons-material/HeatPumpOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';
import {ampResources, lookup} from '@/resources/amp'
import {geochronologyResources} from '@/resources/geochronology'
import {criticalMineralResources} from '@/resources/criticalminerals'
import {geothermalResources} from '@/resources/geothermal'
import {st2Resources} from "@/resources/st2";


let base = [{name: 'Water',
            icon: <WaterDropOutlined/>,
            meta: {label: 'Water'}
            },
            {name: 'geochronology',
            icon: <AccessTime/>,
            meta: {label: 'Geochronology'},
            },
            {name: 'criticalminerals',
            icon: <DiamondOutlined/>,
            meta: {label: 'Critical Minerals'}
            },
            {name: 'geothermal',
            icon: <HeatPumpOutlined/>,
            meta: {label: 'Geothermal'}
            },
            {name: 'st2',
            icon: <WaterDropOutlined/>,
            meta: {label: 'NMWDI SensorThings'}
            },
]


export const resources = [...base,
    ...ampResources, ...lookup,
    ...st2Resources,
    ...geochronologyResources,
    ...criticalMineralResources,
    ...geothermalResources,
]

// ============= EOF =============================================