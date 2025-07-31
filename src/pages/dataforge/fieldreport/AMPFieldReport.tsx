import React from 'react'
import { Box } from '@mui/material'
import { Stepper, Step, StepButton } from '@mui/material'
import { Create, ExportButton } from '@refinedev/mui'
import { useStepsForm } from '@refinedev/react-hook-form'
import { useMediaQuery, useTheme } from '@mui/material'
import { Button } from '@mui/material'
import { SaveButton } from '@refinedev/mui'

import TextField from '@mui/material/TextField'
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
} from '@react-pdf/renderer'

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E4',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
})

// Create Document Component

const AMPFieldReport = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text>Section #1</Text>
        </View>
        <View style={styles.section}>
          <Text>Section #2</Text>
        </View>
      </Page>
    </Document>
  )
}
export const CreateAMPFieldReport: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading, onFinish },
    register,
    handleSubmit,
    control,
    formState: { errors },
    steps: { currentStep, gotoStep },
  } = useStepsForm()

  const theme = useTheme()
  const isSmallOrLess = useMediaQuery(theme.breakpoints.down('sm'))

  const stepTitles = ['Location', 'Output']
  const renderFormByStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField {...register('thing_id')} fullWidth />
          </Box>
        )
      case 1:
        return (
          <Box>
            <PDFViewer
              showToolbar={false}
              width={'100%'}
              height={isSmallOrLess ? '400px' : '600px'}
            >
              <AMPFieldReport />
            </PDFViewer>
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
