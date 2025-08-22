import { ReactNode, useEffect, useState } from 'react'
import { useResourceParams } from '@refinedev/core'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
} from '@mui/material'
import { HelpSharp } from '@mui/icons-material'

const HelpContent = {
  'ocotillo.contact': 'Help in progress, please come back later',
  'ocotillo.map': 'Help in progress, please come back later',
  'ocotillo.asset': 'Help in progress, please come back later',
}

export const useHelp = () => {
  const [helpVisible, setHelpVisible] = useState(false)
  const [helpContent, setHelpContent] = useState<ReactNode>()

  const resource = useResourceParams()

  useEffect(() => {
    const resourceId = resource.identifier

    if (helpVisible) {
      setHelpContent(
        <>
          <Card>
            <CardHeader title={'Help for ' + resourceId} />
            <CardContent>
              {HelpContent[resourceId] || (
                <Alert severity={'warning'}>No help available</Alert>
              )}
            </CardContent>
          </Card>
        </>
      )
    }
  }, [helpVisible])

  const helpButton: ReactNode = (
    <Button
      onClick={() => setHelpVisible(true)}
      variant={'contained'}
      sx={{ width: '10px' }}
    >
      <HelpSharp /> Help
    </Button>
  )

  const helpDrawer: ReactNode = (
    <Drawer
      anchor={'top'}
      onClose={() => setHelpVisible(false)}
      open={helpVisible}
    >
      {helpContent}
    </Drawer>
  )

  return {
    helpDrawer,
    helpButton,
  }
}
