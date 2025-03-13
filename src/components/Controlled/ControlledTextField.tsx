import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledTextField = <T,>({
  control,
  type = "text",
  name,
  label,
  multiline,
  minRows = 4, // Default minimum rows when multiline is true
  ...textFieldProps
}: {
  control: Control<T>;
  type?: React.InputHTMLAttributes<unknown>["type"];
  name: string;
  label: string;
} & TextFieldProps) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!fieldState?.error}
          helperText={fieldState?.error?.message || ""}
          type={type}
          fullWidth
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
        />
      )}
    />
  );
};
