import React from 'react'
import { Box } from '@mui/material'
import { Stepper, Step, StepButton } from '@mui/material'
import { Create, ExportButton } from '@refinedev/mui'
import { useStepsForm } from '@refinedev/react-hook-form'
import { useMediaQuery, useTheme } from '@mui/material'
import { Button } from '@mui/material'
import { SaveButton } from '@refinedev/mui'
import { useOne, useList } from '@refinedev/core'
import { IAsset } from '@/interfaces/ocotillo/IAsset'

import TextField from '@mui/material/TextField'
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  Image,
} from '@react-pdf/renderer'
import { SelectThingComponent } from '@/components/form/thing/SelectThingComponent'
import { IThing, IWell } from '@/interfaces/ocotillo/IThing'

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#E4E4E4',
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  text: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  image: {},
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
})

// Create Document Component

const AMPFieldReport = ({ thing_id }) => {
  const theme = useTheme()
  const isSmallOrLess = useMediaQuery(theme.breakpoints.down('sm'))

  const { data } = useOne<IWell>({
    resource: 'ocotillo.thing-well',
    id: thing_id,
    queryOptions: {
      enabled: !!thing_id,
    },
  })

  const { data: assets } = useList<IAsset>({
    resource: 'ocotillo.asset',
    meta: {
      params: {
        thing_id: thing_id,
      },
    },
    queryOptions: {
      enabled: !!thing_id,
    },
  })
  console.log(assets)

  return (
    <PDFViewer
      showToolbar={false}
      width={'100%'}
      height={isSmallOrLess ? '400px' : '600px'}
    >
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.text}>PointID: {data?.data.name}</Text>
          <Text style={styles.text}>Well Type: {data?.data.well_type}</Text>
          <Text style={styles.text}>
            Well Depth (ft): {data?.data.well_depth || '---'}
          </Text>
          <Text style={styles.text}>
            Hole Depth (ft): {data?.data.hole_depth || '---'}
          </Text>
          <Text style={styles.text}>
            Last Water Level Measurement: {'not yet implemented'}
          </Text>
          <Image
            style={styles.image}
            src={{
              uri: assets?.data[0]?.signed_url,
            }}
          />
          {/*<View style={styles.section}>*/}
          {/*  <Text>Section #1</Text>*/}
          {/*</View>*/}
          {/*<View style={styles.section}>*/}
          {/*  <Text>Section #2</Text>*/}
          {/*</View>*/}
        </Page>
      </Document>
    </PDFViewer>
  )
}
export const CreateAMPFieldReport: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    steps: { currentStep, gotoStep },
  } = useStepsForm()

  const theme = useTheme()
  const isSmallOrLess = useMediaQuery(theme.breakpoints.down('sm'))

  const selectedThing = watch('thing_id')

  const stepTitles = ['Location', 'Output']
  const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <SelectThingComponent
            control={control}
            errors={errors}
            watch={watch}
            thing_type={'water well'}
          />
        )
      case 1:
        return (
          <Box>
            <AMPFieldReport thing_id={selectedThing} />
            {/*</PDFViewer>*/}
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Create
      isLoading={formLoading}
      saveButtonProps={saveButtonProps}
      footerButtons={
        <>
          {currentStep > 0 && (
            <Button
              onClick={() => {
                gotoStep(currentStep - 1)
              }}
            >
              Previous
            </Button>
          )}
          {currentStep < stepTitles.length - 1 && (
            <Button
              onClick={() => {
                gotoStep(currentStep + 1)
              }}
            >
              Next
            </Button>
          )}
          {currentStep === stepTitles.length - 1 && (
            <Button onClick={handleSubmit(onFinish)}>Generate Report</Button>
          )}
        </>
      }
    >
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <Stepper
          nonLinear
          activeStep={currentStep}
          orientation={isSmallOrLess ? 'vertical' : 'horizontal'}
        >
          {stepTitles.map((label, index) => (
            <Step key={label}>
              <StepButton onClick={() => gotoStep(index)}>{label}</StepButton>
            </Step>
          ))}
        </Stepper>
        <br />
        {renderFormByStep(currentStep)}
      </Box>
    </Create>
  )
}
