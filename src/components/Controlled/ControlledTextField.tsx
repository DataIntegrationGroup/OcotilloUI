import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledTextField = <T,>({
  control,
  type,
  name,
  label,
  errorMessage,
  multiline,
  minRows = 4, // Default minimum rows when multiline is true
  ...textFieldProps
}: {
  control: Control<T>;
  type: string;
  name: string;
  label: string;
  errorMessage: string;
} & TextFieldProps) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!errorMessage}
          helperText={errorMessage || ""}
          type={type}
          fullWidth
          multiline={multiline}
          minRows={multiline ? minRows : undefined}
        />
      )}
    />
  );
};
