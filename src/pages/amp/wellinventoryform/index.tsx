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
import {Button, Card} from "@mui/material";
import Stack from "@mui/material/Stack";
import {useShow} from "@refinedev/core";
import Box from "@mui/material/Box";
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import {useState, Fragment} from "react";

const steps = ['Add Location', 'Add Well Details', 'Add Owner Info'];

const LocationStep = () => {
    return (
        <Box>
            <Typography variant={'h3'}>Location</Typography>
        </Box>
    )
}
const WellStep = () => {
    return (
        <Box>
            <Typography variant={'h3'}>Well</Typography>
        </Box>
    )
}
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
                return <LocationStep/>;
            case 1:
                return <WellStep/>;
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
                        {getStepContent()}
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
                        <Button onClick={handleNext}>
                            {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </Button>
                    </Box>
                </Fragment>
            )}
        </Box>
    )
}
// ============= EOF =============================================