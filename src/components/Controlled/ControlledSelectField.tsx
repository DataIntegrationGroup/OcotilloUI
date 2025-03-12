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
  errorMessage,
  options,
  ...selectProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  errorMessage: string;
  options: { value: string | number; label: string }[];
} & SelectProps) => {
  return (
    <FormControl fullWidth error={!!errorMessage}>
      <InputLabel>{label}</InputLabel>
      <Controller
        name={name as Path<T>}
        control={control as unknown as Control<T>}
        render={({ field }) => (
          <Select label={label} {...field} {...selectProps}>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        )}
      />
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
};
