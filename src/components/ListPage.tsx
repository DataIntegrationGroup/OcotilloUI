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

import {ExportButton, List} from "@refinedev/mui";
import {DataGrid} from "@mui/x-data-grid";
import {settings} from "@/settings";
import React from "react";
import {useExport} from "@refinedev/core";

type ListPageProps = {
    columns: any
    dataGridProps: any
    getRowId?: any
    exportProps?: any

}

export const ListPage: React.FC<ListPageProps> = ({columns, dataGridProps, getRowId, exportProps}) => {
    if (!exportProps) {
        exportProps={pageSize: 1000}
    }

    
    const { triggerExport, isLoading} = useExport(
        exportProps
    );
    const headerButtons = ({defaultButtons}) => {
        return (
            <>
                {defaultButtons}
                <ExportButton
                    variant={'contained'}
                    loading={isLoading}
                    onClick={triggerExport} />
            </>
        )
    }
    return (<>
        <List
            headerButtons={headerButtons}
        >
            <DataGrid
                {...dataGridProps}
                rowHeight={settings.rowHeight}
                getRowId={getRowId? getRowId : (row) => row.PointID}
                columns={columns}
                autoHeight
            />
        </List>
        </>)
}

// ============= EOF =============================================