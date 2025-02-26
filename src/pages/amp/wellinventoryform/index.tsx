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
import { DateTimePicker } from "@mui/x-date-pickers";
import { ControlledDateTimePicker, ControlledTextField } from "@/components";

export const WellInventoryForm = () => {
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
          <Grid container spacing={2} direction={{ xs: "column", sm: "row" }}>
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
              <Grid item xs={12}>
                <ControlledTextField
                  label="Project Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="project.project"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledDateTimePicker
                  label="Date Time"
                  sx={{ width: "100%" }}
                  control={control}
                  name="project.date_time"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledTextField
                  label="Field Staff"
                  fullWidth
                  control={control}
                  type="text"
                  name="project.field_staff"
                />
              </Grid>{" "}
            </Grid>
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
              <Grid item xs={12}>
                <ControlledTextField
                  label="First Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.first_name"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledTextField
                  label="Last Name"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.last_name"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledTextField
                  label="Email"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.email"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledTextField
                  label="Cell Phone"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.cell_phone"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <ControlledTextField
                  label="Home Phone"
                  fullWidth
                  control={control}
                  type="text"
                  name="owner.phone"
                />
              </Grid>{" "}
              <Grid item xs={12}>
                <Typography variant="h3">Mailing</Typography>
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
                <Typography variant="h3">Physical</Typography>
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
