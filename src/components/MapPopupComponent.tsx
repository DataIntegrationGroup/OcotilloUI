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

import {Table, TableContainer, TableHead, TableCell, TableRow, TableBody} from "@mui/material";
import Paper from "@mui/material/Paper";

export function mToFt(m) {
    return (m * 3.28084).toFixed(2);
}


export const GeothermalSetMapPopupContent = ({features, setPopupContent}) => {
    setPopupContent({
        coordinates: features[0].geometry.coordinates,
        children: (
            <TableContainer sx={{width: 300}} component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>OBJECTID</TableCell>
                            <TableCell>County</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {
                            features.map((feature, index) => (
                                <TableRow key={index}>
                                    <TableCell align={'left'}>{feature.properties.objectid}</TableCell>
                                    <TableCell>{feature.properties.county}</TableCell>
                                </TableRow>
                            ))
                        }

                    </TableBody>
                </Table>
            </TableContainer>

        )
    });
}

export const SetMapPopupContent = ({
                                       features,
                                       setPopupContent
                                   }) => {

    const transposedData = [
        {key: "Name", values: features.map(point => point.properties.PointID)},
        // { key: "Elevation (ft)", values: features.map(point => mToFt(point._geometry.coordinates[2])) },
        // { key: "Well Depth (ft)", values: features.map(point => point.properties.well_depth?.value) },
        // { key: "Hole Depth (ft)", values: features.map(point => point.properties.hole_depth?.value) },
        // { key: "OSE Well ID", values: features.map(point => point.properties.ose_well_id) },
        {key: "Alternate Site ID", values: features.map(point => point.properties.AlternateSiteID)},
        // { key: "Site No", values: features.map(point => point.properties.site_no) },
    ];

    // const siteColumns = features.map((point, index) => ({
    //     field: `site_${index}`,
    //     header: null,
    //     body: (rowData) => (
    //         <span className={"font-bold"}>
    //     {rowData.values[index] || ""}
    //   </span>
    //     )
    // }));
    //
    // const propertyColumn = [
    //     { field: 'key', header: null }
    // ];
    //
    // const columns    = [...propertyColumn, ...siteColumns];
    setPopupContent({
        coordinates: features[0].geometry.coordinates,
        children: (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <h3 style={{color: "black"}}>Click for more details</h3>
                <div style={{display: 'flex', gap: '1rem'}}>
                    {/*<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>*/}
                    {/*    {transposedData.map((row, index) => (*/}
                    {/*        <div key={index} style={{ display: 'flex', gap: '1rem' }}>*/}
                    {/*            <span className={"font-bold"}>{row.key}</span>*/}
                    {/*            <span>{row.values[0]}</span>*/}
                    {/*        </div>*/}
                    {/*    ))}*/}
                    {/*</div>*/}

                    <TableContainer>
                        <Table>
                            <TableBody>
                                {
                                    transposedData.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.key}</TableCell>
                                            <TableCell>{row.values[0]}</TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>

                </div>
            </div>
        ),
    });
}
// ============= EOF =============================================