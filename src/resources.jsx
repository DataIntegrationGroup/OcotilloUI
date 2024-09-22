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

let base = [
    {
        name: "locations",
        icon: <Place/>,
        list: "/locations",
        edit: "/locations/edit/:id",
        create: "/locations/create",
    },
    {
        name: "wells",
        icon: <Plumbing/>,
        list: "/wells",
        edit: "/wells/edit/:id",
        create: "/wells/create",
    },
    {name: 'LookupTables',
    icon: <TableViewIcon/>}

]

let lookup = ['level_status', 'measurement_method', 'data_quality', 'measuring_agency', 'data_source']

lookup = lookup.map((l) => {
    return {
        name: l,
        list: `/lu_${l}`,
        meta: {
            parent: 'LookupTables'
        }
    }
})
// {name: 'formations',
//     list: "/lu_formations",
//     meta: {
//     parent: 'LookupTables'
// }},
// {name: 'level_status',
//     list: "/lu_levelstatus",
//     meta: {
//     parent: 'LookupTables'
// }},
// {name: 'measurement_method',
//     list: "/lu_measurement_method",
//     meta: {
//     parent: 'LookupTables'
// }},

export const resources= [...base, ...lookup]

// ============= EOF =============================================