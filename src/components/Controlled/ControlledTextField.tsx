import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Control, FormState, Path } from "react-hook-form";

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
  formState: FormState<T>;
  type: string;
  name: Path<T>;
  label: string;
  errorMessage: string;
} & TextFieldProps) => {
  return (
    <Controller
      name={name}
      control={control as unknown as Control<T>}
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
