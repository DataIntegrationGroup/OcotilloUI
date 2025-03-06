import { FormControlLabel, Checkbox } from "@mui/material";
import { Controller, Control, FormState, Path } from "react-hook-form";

export const ControlledCheckbox = <T,>({
  control,
  name,
  label,
  errorMessage,
  ...checkboxProps
}: {
  control: Control<T>;
  formState: FormState<T>;
  name: Path<T>;
  label: string;
  errorMessage: string;
} & React.ComponentProps<typeof Checkbox>) => {
  return (
    <Controller
      name={name}
      control={control as unknown as Control<T>}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox {...field} checked={field.value} {...checkboxProps} />
          }
          label={label}
        />
      )}
    />
  );
};
