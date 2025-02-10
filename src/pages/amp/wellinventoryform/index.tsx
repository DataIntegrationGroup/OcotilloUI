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

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import {useShow} from "@refinedev/core";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import {useState, Fragment} from "react";
import {useForm} from "@refinedev/react-hook-form";
import {Button, Box, TextField} from "@mui/material";
import {IWellInventoryForm} from "@/interfaces/amp";
import {LocationStep} from "@/pages/amp/wellinventoryform/steps/location";
import {WellStep} from "@/pages/amp/wellinventoryform/steps/well";

import * as Yup from "yup";
import {yupResolver} from "@hookform/resolvers/yup";


const steps = ['Add Location', 'Add Well Details', 'Add Owner Info'];


const OwnerStep = () => {
    return (
        <Box>
            <Typography variant={'h3'}>Owner</Typography>
        </Box>
    )
}


export const WellInventoryForm = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [skipped, setSkipped] = useState(new Set<number>());
    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const schema = Yup.object().shape({
        pointid: Yup.string().required('Point ID is required'),
        latitude: Yup.number().required('Latitude is required').min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
        longitude: Yup.number().required('Longitude is required').min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
        northing: Yup.number().required('Northing is required'),
        easting: Yup.number().required('Easting is required'),
        elevation: Yup.number().required('Elevation is required'),
        elevation_units: Yup.string().required('Elevation Units is required'),
        elevation_datum: Yup.string().required('Elevation Datum is required'),
        well_depth: Yup.number().required('Well Depth is required'),

        // site_type: Yup.string().required('Site Type is required'),
    });
    const defaultValues: IWellInventoryForm = {
        pointid: '',
        latitude: 0,
        longitude: 0,
        northing: 0,
        easting: 0,
        elevation: 0,
        elevation_units: '',
        elevation_datum: '',
        well_depth: 0,
    }


    const {register, formState, control, handleSubmit} = useForm<IWellInventoryForm>({
        defaultValues: defaultValues,
        resolver: yupResolver(schema)
    });
    // const {query} = useShow({
    //     resource: 'dashboard',
    //     id: 'dashboard',
    //     dataProviderName: 'amp'
    // });
    // const stats = query.data?.data
    // console.log(query.data?.data)

    const isStepOptional = (step: number) => {
        return step === 1;
    };

    const handleNext = () => {
        console.log('handle next')

        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped(newSkipped);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSkip = () => {
        if (!isStepOptional(activeStep)) {
            // You probably want to guard against something like this,
            // it should never occur unless someone's actively trying to break something.
            throw new Error("You can't skip a step that isn't optional.");
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped((prevSkipped) => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };

    const handleReset = () => {
        setActiveStep(0);
    };


    const getStepContent = () => {
        switch (activeStep) {
            case 0:
                return <LocationStep control={control} formState={formState} register={register}/>;
            case 1:
                return <WellStep control={control} formState={formState} register={register}/>;
            case 2:
                return <OwnerStep/>;
            default:
                return 'Unknown step';
        }
    }

    return (
        <Box>
            <Typography variant={'h3'}>Well Inventory Form</Typography>

            <Stepper activeStep={activeStep}>
                {steps.map((label, index) => {
                    const stepProps = {};
                    const labelProps = {};
                    return (
                        <Step key={label} {...stepProps}>
                            <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>

                    );
                })}
            </Stepper>

            {activeStep === steps.length ? (
                <Fragment>
                    <Typography sx={{mt: 2, mb: 1}}>
                        All steps completed - you&apos;re finished
                    </Typography>
                    <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
                        <Box sx={{flex: '1 1 auto'}}/>
                        <Button onClick={handleReset}>Reset</Button>
                    </Box>
                </Fragment>
            ) : (
                <Fragment>

                    <Box sx={{backgroundColor: '#e6ecf2', margin: 2, borderRadius: 2, padding: 1}}>
                        <form style={{display: "flex", flexDirection: "column"}}>
                            {getStepContent()}
                        </form>
                    </Box>

                    <Box sx={{display: 'flex', flexDirection: 'row', pt: 2}}>
                        <Button
                            color="inherit"
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            sx={{mr: 1}}
                        >
                            Back
                        </Button>
                        <Box sx={{flex: '1 1 auto'}}/>
                        {isStepOptional(activeStep) && (
                            <Button color="inherit" onClick={handleSkip} sx={{mr: 1}}>
                                Skip
                            </Button>
                        )}
                        <Button onClick={handleSubmit(handleNext)}>
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                </Fragment>
            )}
        </Box>
    )
}
// ============= EOF =============================================