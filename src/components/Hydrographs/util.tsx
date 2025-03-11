// ===============================================================================
// Author:  Jake Ross
// Copyright  New Mexico Bureau of Geology & Mineral Resources
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// ===============================================================================

import type {IHydrographOptions} from "@/interfaces/st2";

export const transform = (v: number,
                          ref: number,
                          index: number,
                          offset: number,
                          options: IHydrographOptions) => {

    if (options != undefined) {
        if (options.useNormalization) {
            return (v - ref)
        } else if (options.useElevation) {
            // return (v - datasource[0].data[0][ytag]).toFixed(2)
        } else if (options.useCompact) {
            return (v - ref + offset)
        }
    }

    return v

}
// ============= EOF =============================================