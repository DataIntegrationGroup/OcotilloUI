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
// export default accessControlProvider: ;

import {getAccessToken} from "./fief-provider";
import {jwtDecode} from "jwt-decode";

export const accessControlProvider = {
    can: async ({resource, action}) => {
        // const token = jwtDecode(getAccessToken());
        // const permissions = token['permissions'] ?? [];
        // console.log('can permissions', permissions)

        //access control disabled for now.
        // need to defined permissions in fief
        return {can: true};

        // if (permissions.includes(`${resource}:${action}`)) {
        //     return {can: true}
        // } else {
        //     return {
        //         can: false,
        //         reason: "You do not have the necessary permissions to perform this action."
        //     }
        // }
    }
}
//
// export default function getCan({resource, action}) {
//     const token = getToken();
//     return {can: true};
// }


// ============= EOF =============================================