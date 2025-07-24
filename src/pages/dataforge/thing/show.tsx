import { Stack, Typography } from '@mui/material'
import { useShow } from '@refinedev/core'
import { Show, TextFieldComponent as TextField } from '@refinedev/mui'

export const WellShow = () => {
  // const isLoading = false
  const { queryResult } = useShow({})

  const { data, isLoading } = queryResult

  const record = data?.data

  // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
  //   resource: "categories",
  //   id: record?.category?.id || "",
  //   queryOptions: {
  //     enabled: !!record,
  //   },
  // });

  return (
    <Show isLoading={isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">
          {'ID'}
        </Typography>

        <TextField value={record?.id} />

        <Typography variant="body1" fontWeight="bold">
          {'Well Depth (ft)'}
        </Typography>
        <TextField value={record?.well_depth} />

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
      </Stack>
    </Show>
  )
}
