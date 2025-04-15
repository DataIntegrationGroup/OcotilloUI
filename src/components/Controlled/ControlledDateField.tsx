import { Controller, Control, Path } from "react-hook-form";
import { FormControl } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

export const ControlledDateField = <T,>({
  control,
  name,
  label,
  required,
  ...pickerProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  required?: boolean;
} & any) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control as Control<T>}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={!!fieldState.error} required={required}>
          <DateTimePicker
            label={label}
            value={field.value ? dayjs(field.value as string) : null}
            onChange={(date) => {
              field.onChange(date ? date.toISOString() : null);
            }}
            slotProps={{
              textField: {
                required,
                error: !!fieldState.error,
                helperText: fieldState?.error?.message,
              },
            }}
            {...pickerProps}
          />
        </FormControl>
      )}
    />
  );
};
