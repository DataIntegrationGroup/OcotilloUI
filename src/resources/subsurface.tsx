// ===============================================================================
// Author:  Jake Ross
// Copyright 2025 New Mexico Bureau of Geology & Mineral Resources
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// ===============================================================================

import DashboardOutlined from "@mui/icons-material/DashboardOutlined";

let subsurface = [
    {
        name: 'dashboard', icon: <DashboardOutlined/>,
        list: "/subsurface/dashboard",
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined/>,
        },
    },

]

export const subsurfaceResources = subsurface.map((r) => {
    let meta = r.meta || {}
    if (!meta['parent']) {
        meta['parent'] = 'subsurface'
    }

    meta['dataProviderName'] = 'subsurface'
    return {
        ...r,
        meta
    }
})

// ============= EOF =============================================