import {
  Button,
  Card,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Stack,
  Typography,
} from "@mui/material";
import { HttpError, useOne, useShow } from "@refinedev/core";
import { EditButton, ListButton, RefreshButton, Show } from "@refinedev/mui";
import MapComponent from "@/components/MapComponent";
import { ILocation, IWell } from "@/interfaces/amp";
import { Layer, Source } from "react-map-gl";
import { publicReleaseChip } from "@/components/util";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";

export const LocationShow = () => {
  const { query } = useShow<ILocation>();
  const { data: locationData, isFetching: isFetchingLocation } = query;

  const location = locationData?.data;

  const { data: wellData, isLoading: isLoadingWells } = useOne<
    IWell,
    HttpError
  >({
    resource: "wells",
    id: location?.PointID,
    dataProviderName: "amp",
  });

  const well = wellData?.data;

  const { data: photosData } = useOne({
    resource: "photos",
    id: location?.PointID,
    dataProviderName: "amp",
  });

  const photos = photosData?.data || [];

  const locationGeometry = {
    type: "FeatureCollection",
    features: [
      {
        type: "Point",
        geometry: location?.geometry,
      },
    ],
  };

  const labeledValue = (label: string, value: string) => {
    return (
      <Stack direction={"row"} gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {label}:
        </Typography>
        <Typography variant="body1">{value}</Typography>
      </Stack>
    );
  };

  const handleMakeReport = () => {
    console.log("make report");
    alert("make report not yet implemented");
  };

  return (
    <Show
      headerButtons={
        <>
          <ListButton />
          <EditButton />
          <RefreshButton />
          <Button
            onClick={handleMakeReport}
            startIcon={<SummarizeOutlinedIcon />}
          >
            Report
          </Button>
        </>
      }
      isLoading={isFetchingLocation && isLoadingWells}
    >
      <Card sx={{ margin: 1, padding: 1 }}>
        <Stack direction={"row"} gap={3}>
          <Stack>
            {labeledValue("PointID", location?.PointID)}
            {labeledValue("Location Name", location?.SiteID)}
            <Typography variant="body1" fontWeight="bold">
              {"Public Release"}:{publicReleaseChip({ row: location })}
            </Typography>
          </Stack>
          <Stack>
            {labeledValue("Measuring Point", well?.measuring_point)}
            {labeledValue(
              "Measuring Point Height (ft)",
              well?.measuring_point_height_ftin,
            )}
            {labeledValue("Formation", well?.formation)}
            {labeledValue("OSE Well ID", well?.ose_well_id)}
          </Stack>
        </Stack>
      </Card>
      <Card sx={{ margin: 1, padding: 1 }}>
        <MapComponent>
          <Source key="foo" id="foo" type="geojson" data={locationGeometry}>
            <Layer
              id="location"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#B42222",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1,
              }}
            />
          </Source>
        </MapComponent>
      </Card>
      <Card>
        <ImageList sx={{ width: 500, height: 450 }}>
          {photos.map(
            (item: {
              img: string;
              src: string;
              caption: string;
              key: string;
            }) => {
              if (item == undefined || item.key == undefined) {
                return null;
              }
              return (
                <ImageListItem key={item.img}>
                  <img src={item?.src} alt={item?.caption} loading="lazy" />
                  <ImageListItemBar title={item?.caption} position="below" />
                </ImageListItem>
              );
            },
          )}
        </ImageList>
      </Card>
    </Show>
  );
};
