import {ShowButton, EditButton, List, useDataGrid} from "@refinedev/mui";
import React from "react";

import {type GridColDef, type GridRowHeightParams} from "@mui/x-data-grid";

import type {IObservedProperty} from "@/interfaces/st2";
import {ListPage} from "@/components/ListPage";


export const ST2ObservedPropertiesList: React.FC = () => {

    const {dataGridProps} = useDataGrid<IObservedProperty>(
        {
            resource: "ObservedProperties",
            dataProviderName: "st2",
        }
    );

    const columns = React.useMemo<GridColDef<IObservedProperty>[]>(
        () => [
            {
                field: "@iot.id",
                headerName: "ID",
                type: "string",
                minWidth: 30,
            },
            {
                field: "name",
                headerName: "Name",
                type: "string",
                minWidth: 300,
            },
            {
                field: "description",
                headerName: "Description",
                type: "string",
                minWidth: 300,
                renderCell: (params) => (
                    <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                        {params.value}
                    </div>
                ),

            },
            {
                field: "actions",
                headerName: "Actions",
                renderCell: function render({row}) {
                    return (
                        <>
                            <EditButton hideText recordItemId={row['@iot.id']}/>
                            <ShowButton hideText recordItemId={row['@iot.id']}/>
                        </>
                    );
                },
                align: "center",
                headerAlign: "center",
                minWidth: 80,
                flex: 0.3,
            },
        ],
        []
        // [categoriesData, isLoading],
    );

    const getRowHeight = (params: GridRowHeightParams) => {
        if (params.model.description.length > 50) {
            return 60; // Set a taller height for rows with long descriptions
        }
    };

    return ( <ListPage
        getRowId={(row) => row["@iot.id"]}
        columns={columns} dataGridProps={{...dataGridProps, getRowHeight}} />);
};
