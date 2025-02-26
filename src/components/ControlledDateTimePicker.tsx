import { DateTimePicker } from "@mui/x-date-pickers";
import { Controller, Control, Path } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";

export const ControlledDateTimePicker = <T,>({
  control,
  name,
  label,
  errorMessage,
  ...dateTimePickerProps
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  errorMessage?: string;
} & Omit<
  React.ComponentProps<typeof DateTimePicker>,
  "value" | "onChange"
>) => {
  return (
    <Controller
      name={name}
      control={control as unknown as Control<T>}
      render={({ field }) => (
        <DateTimePicker
          {...dateTimePickerProps}
          label={label}
          value={field.value ? dayjs(field.value) : null} // Convert value to Dayjs
          onChange={(newValue: Dayjs | null) => field.onChange(newValue)}
          slotProps={{
            textField: {
              error: !!errorMessage,
              helperText: errorMessage || "",
              fullWidth: true,
            },
          }}
        />
      )}
    />
  );
};
