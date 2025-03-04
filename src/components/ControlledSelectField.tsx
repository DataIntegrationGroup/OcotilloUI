import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectProps,
} from "@mui/material";
import { Controller, Control, FormState, Path } from "react-hook-form";

export const ControlledSelectField = <T,>({
  control,
  name,
  label,
  errorMessage,
  options,
  ...selectProps
}: {
  control: Control<T>;
  formState: FormState<T>;
  name: Path<T>;
  label: string;
  errorMessage: string;
  options: { value: string | number; label: string }[];
} & SelectProps) => {
  return (
    <FormControl fullWidth error={!!errorMessage}>
      <InputLabel>{label}</InputLabel>
      <Controller
        name={name}
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
