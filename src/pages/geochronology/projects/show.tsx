import {Stack, Typography} from "@mui/material";
import {useOne, useShow} from "@refinedev/core";
import {
    DateField,
    MarkdownField,
    Show,
    TextFieldComponent as TextField,
} from "@refinedev/mui";
import {IProject} from "../../../interfaces/geochronology";

export const ProjectShow = () => {
    const {query} = useShow<IProject>();
    const { data, isFetching, isError, refetch } = query;

    const project = data?.data;
    //
    // const {data, isLoading} = queryResult;
    //
    // const record = data?.data;

    // const { data: categoryData, isLoading: categoryIsLoading } = useOne({
    //   resource: "categories",
    //   id: record?.category?.id || "",
    //   queryOptions: {
    //     enabled: !!record,
    //   },
    // });

    return (
        <Show isLoading={isFetching}>
            <Stack gap={1}>
                <Typography variant="body1" fontWeight="bold">
                    {"ID"}
                </Typography>
                <TextField value={project?.id} />

                <Typography variant="body1" fontWeight="bold">
                  {"Name"}
                </Typography>
                <TextField value={project?.name} />

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
    );
};
