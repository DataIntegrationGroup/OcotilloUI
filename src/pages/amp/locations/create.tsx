import type { HttpError } from "@refinedev/core";
import { Create, useAutocomplete } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm } from "@refinedev/react-hook-form";

import { Controller } from "react-hook-form";

import type { ILocation } from "../../../interfaces/amp";
import {Nullable} from "@/interfaces";


export const LocationCreate: React.FC = () => {
  const {
    saveButtonProps,
    register,
    control,
    formState: { errors },
  } = useForm<ILocation, HttpError, Nullable<ILocation>>();

  // const { autocompleteProps } = useAutocomplete<ICategory>({
  //   resource: "categories",
  // });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("PointID", {
            required: "This field is required",
          })}
          error={!!errors.PointID}
          helperText={errors.PointID?.message}
          margin="normal"
          fullWidth
          label="PointID"
          name="PointID"
          autoFocus
        />
          <TextField
              {...register("SiteID", {
                  required: "This field is required",
              })}
              error={!!errors.SiteID}
              helperText={errors.SiteID?.message}
              margin="normal"
              fullWidth
              label="SiteID"
              name="SiteID"
              autoFocus
          />
        {/*<Controller*/}
        {/*  control={control}*/}
        {/*  name="status"*/}
        {/*  rules={{ required: "This field is required" }}*/}
        {/*  // eslint-disable-next-line*/}
        {/*  defaultValue={null as any}*/}
        {/*  render={({ field }) => (*/}
        {/*    <Autocomplete<IStatus>*/}
        {/*      options={["published", "draft", "rejected"]}*/}
        {/*      {...field}*/}
        {/*      onChange={(_, value) => {*/}
        {/*        field.onChange(value);*/}
        {/*      }}*/}
        {/*      renderInput={(params) => (*/}
        {/*        <TextField*/}
        {/*          {...params}*/}
        {/*          label="Status"*/}
        {/*          margin="normal"*/}
        {/*          variant="outlined"*/}
        {/*          error={!!errors.status}*/}
        {/*          helperText={errors.status?.message}*/}
        {/*          required*/}
        {/*        />*/}
        {/*      )}*/}
        {/*    />*/}
        {/*  )}*/}
        {/*/>*/}
        {/*<Controller*/}
        {/*  control={control}*/}
        {/*  name="category"*/}
        {/*  rules={{ required: "This field is required" }}*/}
        {/*  // eslint-disable-next-line*/}
        {/*  defaultValue={null as any}*/}
        {/*  render={({ field }) => (*/}
        {/*    <Autocomplete*/}
        {/*      {...autocompleteProps}*/}
        {/*      {...field}*/}
        {/*      onChange={(_, value) => {*/}
        {/*        field.onChange(value);*/}
        {/*      }}*/}
        {/*      getOptionLabel={(item) => {*/}
        {/*        return (*/}
        {/*          autocompleteProps?.options?.find(*/}
        {/*            (p) => p?.id?.toString() === item?.id?.toString(),*/}
        {/*          )?.title ?? ""*/}
        {/*        );*/}
        {/*      }}*/}
        {/*      isOptionEqualToValue={(option, value) =>*/}
        {/*        value === undefined ||*/}
        {/*        option?.id?.toString() === (value?.id ?? value)?.toString()*/}
        {/*      }*/}
        {/*      renderInput={(params) => (*/}
        {/*        <TextField*/}
        {/*          {...params}*/}
        {/*          label="Category"*/}
        {/*          margin="normal"*/}
        {/*          variant="outlined"*/}
        {/*          error={!!errors.category}*/}
        {/*          helperText={errors.category?.message}*/}
        {/*          required*/}
        {/*        />*/}
        {/*      )}*/}
        {/*    />*/}
        {/*  )}*/}
        {/*/>*/}
        {/*<TextField*/}
        {/*  {...register("content", {*/}
        {/*    required: "This field is required",*/}
        {/*  })}*/}
        {/*  error={!!errors.content}*/}
        {/*  helperText={errors.content?.message}*/}
        {/*  margin="normal"*/}
        {/*  label="Content"*/}
        {/*  multiline*/}
        {/*  rows={4}*/}
        {/*/>*/}
      </Box>
    </Create>
  );
};
