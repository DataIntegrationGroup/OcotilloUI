import {Card, CardContent, CardHeader, Typography, useTheme} from '@mui/material';
import {useForm} from "@refinedev/react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {IWaterLevelForm} from "@/interfaces/amp";
import {WaterLevelSchema, SchemaDefaults} from "@/pages/amp/waterlevelform/water_level.schema";
import {Box} from "@mui/system";
import {useMutation} from "@tanstack/react-query";
import {useNotification} from "@refinedev/core";
import Grid from "@mui/material/Grid2";
import React from "react";
import {ControlledTextField} from "@/components";


const createWaterLevelForm = async (data: IWaterLevelForm) => {
    console.log("Submitting Water Level Form:", data);

}


export const WaterLevelForm = () => {
    const theme = useTheme();

    const {control, handleSubmit, reset, setValue, watch} =
        useForm<IWaterLevelForm>({
            defaultValues: SchemaDefaults,
            resolver: yupResolver(WaterLevelSchema),
        });

    const {open, close} = useNotification();

    const {mutateAsync, isPending: isFormSubmissionPending} = useMutation({
        mutationFn: createWaterLevelForm,
        onMutate: () => {
            open?.({
                key: "water-level-submission",
                type: "progress",
                message: "Submitting Well Inventory Form...",
            });
        },
        onSuccess: () => {
            close?.("water-level-submission");
            open?.({
                type: "success",
                message: "Form Submitted Successfully!",
                description: "Your well inventory form has been submitted.",
            });
        },
        onError: () => {
            close?.("water-level-submission");
            open?.({
                type: "error",
                message: "Failed to Submit Form",
                description: "Please check your input and try again later.",
            });
        },
    });

    const handleFormSubmit = async (data: IWaterLevelForm) => {
        try {
            await mutateAsync(data);
            reset();
        } catch (err) {
            console.error("Form submission error:", err);
        }
    }
    return (
        <>
            <Card>
                <CardHeader title="Water Level Form"/>
                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleSubmit(handleFormSubmit)}
                    >
                        <Grid
                            container
                            spacing={2}
                            direction={{xs: "column", sm: "row"}}
                            sx={{
                                maxWidth: theme.breakpoints.values.lg,
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        >
                            <Grid
                                container
                                sx={{width: "100%"}}
                                direction={{xs: "column", sm: "row"}}
                            >
                                <Grid size={{xs: 12}}>
                                    <ControlledTextField
                                        type="number"
                                        label="Depth to Water BGS"
                                        control={control}
                                        name="DepthToWaterBGS"
                                    />
                                </Grid>
                                <Grid size={{xs: 12}}>
                                    <ControlledTextField
                                        multiline
                                        type='text'
                                        name='Notes'
                                        label='Notes'
                                        control={control}/>

                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </>
    );
}