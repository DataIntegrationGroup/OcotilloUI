import {Button, Card, ImageList, ImageListItem, ImageListItemBar, Stack, Typography} from "@mui/material";
import {HttpError, useOne, useShow} from "@refinedev/core";
import {
    DateField, EditButton, ListButton,
    MarkdownField, RefreshButton,
    Show,
    TextFieldComponent as TextField,
} from "@refinedev/mui";

import MapComponent from "@/components/MapComponent";
import {ILocation, IWell} from "@/interfaces/amp";
import {Layer, Source} from "react-map-gl";
import React from "react";
import {publicReleaseChip} from "@/components/util";
import SummarizeIcon from '@mui/icons-material/Summarize';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';


export const LocationShow = () => {
    // const isLoading = false;
    const {query} = useShow<ILocation>(
    );
    const { data: locationData, isFetching: isFetchingLocation, isError: locationIsError, refetch } = query;

    const location = locationData?.data;
    console.log('show location', location);

    const {data: wellData, isLoading: isLoadingWells, isError} = useOne<IWell, HttpError>({
        resource: "wells",
        id: location?.PointID,
        dataProviderName: "amp"
    });

    // console.log('show well', wellData);
    const well = wellData?.data;
    console.log('show well', well);


    const {data: photosData, isLoading: isLoadingPhotos, isError: isErrorPhotos} = useOne({
        resource: "photos",
        id: location?.PointID,
        dataProviderName: "amp"
    });

    const photos = photosData?.data || [];
    // const location = {}
    // const {queryResult} = useShow({});
    //
    // const {data, isLoading} = queryResult;
    //
    // const record = data?.data;

    // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    //   resource: "categories",
    //   id: record?.category?.id || "",
    //   queryOptions: {
    //     enabled: !!record,
    //   },
    // });

    const locationGeometry = {'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Point',
                'geometry': location?.geometry,
            },
        ]}

    const labeledValue = (label: string, value: string) => {
        return (
            <Stack direction={'row'} gap={1}>
                <Typography variant="body1" fontWeight="bold">
                    {label}:
                </Typography>
                <Typography variant="body1">
                    {value}
                </Typography>
            </Stack>
        )
    }

    const handleMakeReport = () => {
        console.log('make report');
        alert('make report not yet implemented');
    }

    return (
        <Show
            headerButtons={<><ListButton />
                <EditButton />
                <RefreshButton />
                <Button
                    onClick={handleMakeReport}
                    startIcon={<SummarizeOutlinedIcon/>}>Report</Button>
            </>
            }

            isLoading={isFetchingLocation && isLoadingWells}>
            <Card sx={{margin: 1, padding: 1}}>
                <Stack direction={'row'} gap={3}>
                    <Stack>
                        {labeledValue('PointID', location?.PointID)}
                        {labeledValue('Location Name', location?.SiteID)}
                        <Typography variant="body1" fontWeight="bold">
                            {"Public Release"}:
                            {publicReleaseChip({row: location})}</Typography>
                    </Stack>
                    <Stack>
                        {labeledValue('Measuring Point', well?.measuring_point)}
                        {labeledValue('Measuring Point Height (ft)', well?.measuring_point_height_ftin)}
                        {labeledValue('Formation', well?.formation)}
                        {labeledValue('OSE Well ID', well?.ose_well_id)}

                        {/*<Typography variant="body1" fontWeight="bold">*/}
                        {/*    {"Measuring Point"}: {well?.measuring_point}*/}
                        {/*</Typography>*/}
                        {/*<Typography variant="body1" fontWeight="bold">*/}
                        {/*    {"Measuring Point Height (ft)"}: {well?.measuring_point_height_ftin}*/}
                        {/*</Typography>*/}
                        {/*<Typography variant="body1" fontWeight="bold">*/}
                        {/*    {"Well Number"}: {well?.WellNumber}*/}
                        {/*</Typography>*/}
                        {/*<Typography variant="body1" fontWeight="bold">*/}
                        {/*    {"Well Type"}: {well?.WellType}*/}
                        {/*</Typography>*/}
                        {/*<Typography variant="body1" fontWeight="bold">*/}
                        {/*    {"Well Status"}: {well?.WellStatus}*/}
                        {/*</Typography>*/}
                    </Stack>
                </Stack>
            </Card>
            <Card sx={{margin: 1, padding: 1}}>
                <MapComponent>
                    <Source
                        key='foo'
                        id='foo'
                        type='geojson'
                        data={locationGeometry}>
                        <Layer
                            id="location"
                            type="circle"
                            paint={{
                                'circle-radius': 6,
                                'circle-color': '#B42222',
                                'circle-stroke-color': '#ffffff',
                                'circle-stroke-width': 1,
                            }}
                        />
                    </Source>
                </MapComponent>
                {/*<TextField value={record?.id} />*/}

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Title"}*/}
                {/*</Typography>*/}
                {/*<TextField value={record?.title} />*/}

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Content"}*/}
                {/*</Typography>*/}
                {/*<MarkdownField value={record?.content} />*/}

                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Category"}*/}
                {/*</Typography>*/}
                {/*{categoryIsLoading ? <>Loading...</> : <>{categoryData?.data?.title}</>}*/}
                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"Status"}*/}
                {/*</Typography>*/}
                {/*<TextField value={record?.status} />*/}
                {/*<Typography variant="body1" fontWeight="bold">*/}
                {/*  {"CreatedAt"}*/}
                {/*</Typography>*/}
                {/*<DateField value={record?.createdAt} />*/}
            </Card>
            <Card>
                <ImageList sx={{ width: 500, height: 450 }}>
                    {photos.map((item) => {
                        console.log('item', item);
                        if (item ==undefined || item.key == undefined) {
                            return null;
                        }
                           return ( <ImageListItem key={item.img}>
                                <img
                                    // srcSet={`${item.img}?w=248&fit=crop&auto=format&dpr=2 2x`}
                                    // src={`${item?.img}?w=248&fit=crop&auto=format`}
                                    src={item?.src}
                                    alt={item?.caption}
                                    loading="lazy"
                                />
                                <ImageListItemBar
                                    title={item?.caption}
                                    // subtitle={<span>by: {item.author}</span>}
                                    position="below"
                                />
                            </ImageListItem>)
                    }
                    )}
                </ImageList>
            </Card>
        </Show>
    );
};
// ============= EOF =============================================
