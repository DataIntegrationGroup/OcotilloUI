import { FormControlLabel, Checkbox } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledCheckbox = <T,>({
  control,
  name,
  label,
  errorMessage,
  ...checkboxProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  errorMessage: string;
} & React.ComponentProps<typeof Checkbox>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field }) => (
        <FormControlLabel
          labelPlacement="start"
          control={
            <Checkbox {...field} checked={field.value} {...checkboxProps} />
          }
          label={label}
        />
      )}
    />
  );
};
