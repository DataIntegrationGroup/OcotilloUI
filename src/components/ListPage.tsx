import { ExportButton, List } from "@refinedev/mui";
import { DataGrid } from "@mui/x-data-grid";
import { settings } from "@/settings";
import React from "react";
import { useExport } from "@refinedev/core";

type ListPageProps = {
  title?: string | null;
  columns: any;
  dataGridProps: any;
  exportProps?: any;
  children?: any;
  onSelectionChange?: (selectionModel: any) => void;
  getRowId?: (row: any) => number;
  isLoading?: any;
};

export const ListPage: React.FC<ListPageProps> = ({
  title,
  columns,
  dataGridProps,
  getRowId,
  exportProps,
  children,
  onSelectionChange,
  isLoading,
}) => {
  if (!exportProps) {
    exportProps = { pageSize: 1000 };
  }

  const handleSelectionChangeWrapper = (selectionModel) => {
    if (onSelectionChange) {
      onSelectionChange(selectionModel);
    }
  };

  const { triggerExport, isLoading: exportIsLoading } = useExport(exportProps);
  const headerButtons = ({ defaultButtons }) => {
    return (
      <>
        {defaultButtons}
        <ExportButton
          variant={"contained"}
          loading={exportIsLoading}
          onClick={triggerExport}
        />
      </>
    );
  };

  return (
    <List headerButtons={headerButtons} title={title}>
      {children}
      <DataGrid
        {...dataGridProps}
        disableRowSelectionOnClick={false}
        rowHeight={settings.rowHeight}
        getRowId={getRowId ? getRowId : (row) => row.PointID}
        columns={columns}
        autoHeight
        onRowSelectionModelChange={handleSelectionChangeWrapper}
        loading={isLoading}
      />
    </List>
  );
};
