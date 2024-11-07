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


import Grid from "@mui/material/Grid";
import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
// import Tiptap from "@/components/Tiptap";

export const ReportBuilder = () => {
    return (
        <Grid container spacing={1}>
            <Grid item xs={3}>
                <Box border={1}>
                    <Typography variant="h6">Report Builder</Typography>
                    <Typography variant="body1">This is the report builder page</Typography>
                </Box>
            </Grid>
            <Grid item xs={9}>
                <Box border={1}>
                    <Typography variant="h6">Report Builder</Typography>
                    <Typography variant="body1">This is the report builder page</Typography>
                    {/*<Tiptap />*/}
                </Box>
            </Grid>
        </Grid>
    );
}
// ============= EOF =============================================