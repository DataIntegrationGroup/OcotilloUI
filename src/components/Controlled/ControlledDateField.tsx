import { Controller, Control, Path } from "react-hook-form";
import { FormControl, FormHelperText, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

export const ControlledDateField = <T,>({
  control,
  name,
  label,
  required,
  ...dateProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  required?: boolean;
} & any) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
          <DatePicker
            label={label}
            {...field}
            {...dateProps}
            disableFuture
            inputFormat="yyyy-MM-dd"
            renderInput={(params: any) => <TextField {...params} />}
          />
          {fieldState?.error && (
            <FormHelperText>{fieldState?.error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
