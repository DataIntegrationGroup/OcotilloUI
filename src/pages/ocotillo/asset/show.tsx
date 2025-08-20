import { Stack, Typography } from '@mui/material'
import { useOne, useShow } from '@refinedev/core'
import {
  DateField,
  MarkdownField,
  Show,
  TextFieldComponent as TextField,
} from '@refinedev/mui'
import Box from '@mui/material/Box'

export const AssetShow = () => {
  // const isLoading = false
  const { queryResult } = useShow({
    // resource: 'asset',
    // dataProviderName: 'dataforge',
    queryOptions: {
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  })

  const { data, isLoading } = queryResult
  const record = data?.data

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {'ID'}
        </Typography>

        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          {'Name'}
        </Typography>
        <TextField value={record?.name} />
        <Box
          component="img"
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          src={record?.signed_url}
          alt={record?.name}
        />
      </Stack>
    </Show>
  )
}
