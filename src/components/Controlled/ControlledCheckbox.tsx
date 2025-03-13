import {
  FormControlLabel,
  Checkbox,
  FormHelperText,
  FormControl,
} from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledCheckbox = <T,>({
  control,
  name,
  label,
  ...checkboxProps
}: {
  control: Control<T>;
  name: string;
  label: string;
} & React.ComponentProps<typeof Checkbox>) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as unknown as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl error={!!fieldState?.error}>
          <FormControlLabel
            labelPlacement="start"
            control={
              <Checkbox
                {...field}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                {...checkboxProps}
              />
            }
            label={label}
          />
          {fieldState.error && (
            <FormHelperText>{fieldState?.error?.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
