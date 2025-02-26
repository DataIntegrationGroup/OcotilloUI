import { useForm } from "@refinedev/react-hook-form";
import { IWellInventoryForm } from "@/interfaces/amp";
import { yupResolver } from "@hookform/resolvers/yup";
import { WellInventorySchema, SchemaDefaults } from "./well_inventory.schema";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { ControlledDateTimePicker, ControlledTextField } from "@/components";
import { useTheme, useMediaQuery } from "@mui/material";

export const WellInventoryForm = () => {
  const theme = useTheme();
  const isSmBreakpoint = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdBreakpoint = useMediaQuery(theme.breakpoints.down("md"));
  const isLgBreakpoint = useMediaQuery(theme.breakpoints.down("lg"));

  const { register, formState, control, handleSubmit } =
    useForm<IWellInventoryForm>({
      defaultValues: SchemaDefaults,
      resolver: yupResolver(WellInventorySchema),
    });

  return (
    <Card>
      <CardHeader title="Well Inventory Form" />
      <CardContent sx={{ padding: "2rem" }}>
        <Box component="form" autoComplete="off">
          <Grid
            container
            spacing={2}
            direction={{ xs: "column", sm: "row" }}
            sx={{
              maxWidth: theme.breakpoints.values.xl,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <Grid
              container
              item
              spacing={2}
              xs={12}
              direction={{ xs: "column", sm: "row" }}
            >
              <Grid item xs={12}>
                <Typography variant="h2">Project</Typography>
              </Grid>{" "}
              <Grid item xs={12} sm={6} lg={4}>
                <ControlledTextField
                  label="Project Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="project.project"
                />
              </Grid>{" "}
              <Grid
                item
                xs={12}
                sm={6}
                lg={4}
                sx={{ paddingLeft: isSmBreakpoint ? "" : "1rem !important" }}
              >
                <ControlledDateTimePicker
                  label="Date Time"
                  sx={{ width: "100%" }}
                  control={control}
                  name="project.date_time"
                />
              </Grid>{" "}
              <Grid
                item
                xs={12}
                lg={4}
                sx={{ paddingLeft: isLgBreakpoint ? "" : "1rem !important" }}
              >
                <ControlledTextField
                  label="Field Staff"
                  fullWidth
                  control={control}
                  type="text"
                  name="project.field_staff"
                />
              </Grid>{" "}
            </Grid>{" "}
            <Grid
              container
              item
              spacing={2}
              xs={12}
              direction={{ xs: "column", sm: "row" }}
            >
              <Grid item xs={12}>
                <Typography variant="h2">Owner Data</Typography>
              </Grid>
              <Grid
                container
                item
                spacing={2}
                xs={12}
                sx={{
                  marginLeft: "0rem !important",
                  marginRight: "0rem !important",
                }}
                direction={{ xs: "column", sm: "row" }}
              >
                <Grid item xs={12} sm={6} lg={3}>
                  <ControlledTextField
                    label="First Name"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.first_name"
                  />
                </Grid>{" "}
                <Grid
                  item
                  xs={12}
                  sm={6}
                  lg={3}
                  sx={{ paddingLeft: isSmBreakpoint ? "" : "1rem !important" }}
                >
                  <ControlledTextField
                    label="Last Name"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.last_name"
                  />
                </Grid>{" "}
                <Grid
                  item
                  xs={12}
                  sm={6}
                  lg={3}
                  sx={{ paddingLeft: isLgBreakpoint ? "" : "1rem !important" }}
                >
                  <ControlledTextField
                    label="First Name (Secondary)"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.second_first_name"
                  />
                </Grid>{" "}
                <Grid
                  item
                  xs={12}
                  sm={6}
                  lg={3}
                  sx={{ paddingLeft: isSmBreakpoint ? "" : "1rem !important" }}
                >
                  <ControlledTextField
                    label="Last Name (Secondary)"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.second_last_name"
                  />
                </Grid>{" "}
              </Grid>{" "}
              <Grid
                container
                item
                spacing={2}
                xs={12}
                sx={{
                  marginLeft: "0rem !important",
                  marginRight: "0rem !important",
                }}
                direction={{ xs: "column", sm: "row" }}
              >
                <Grid item xs={12} sm={6} lg={3}>
                  <ControlledTextField
                    label="Cell Phone"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.cell_phone"
                  />
                </Grid>{" "}
                <Grid
                  item
                  xs={12}
                  sm={6}
                  lg={3}
                  sx={{ paddingLeft: isSmBreakpoint ? "" : "1rem !important" }}
                >
                  <ControlledTextField
                    label="Home Phone"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.phone"
                  />
                </Grid>{" "}
                <Grid
                  item
                  xs={12}
                  lg={6}
                  sx={{ paddingLeft: isLgBreakpoint ? "" : "1rem !important" }}
                >
                  <ControlledTextField
                    label="Email"
                    fullWidth
                    control={control}
                    type="text"
                    name="owner.email"
                  />
                </Grid>{" "}
              </Grid>{" "}
              <Grid item xs={12}>
                <Typography variant="h4">Mailing</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="City" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="State" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="Zip Code" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <Typography variant="h4">Physical</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="City" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="State" fullWidth />
              </Grid>{" "}
              <Grid item xs={12}>
                <TextField label="Zip Code" fullWidth />
              </Grid>{" "}
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};
