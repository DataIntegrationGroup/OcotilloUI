import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectProps,
} from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledSelectField = <T,>({
  control,
  name,
  label,
  options,
  required,
  ...selectProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  options: { value: string | number; label: string }[];
  required?: boolean;
} & SelectProps) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
          <InputLabel>{label}</InputLabel>
          <Select label={label} {...field} {...selectProps}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {fieldState?.error && (
            <FormHelperText>{fieldState?.error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
