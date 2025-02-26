import InputMask from "react-input-mask";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledPhoneField = <T,>({
  control,
  name,
  label,
  errorMessage,
  ...textFieldProps
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  errorMessage?: string;
} & TextFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <InputMask
          mask="(999)-999-9999"
          value={field.value || ""}
          onChange={field.onChange}
        >
          {(inputProps) => (
            <TextField
              {...inputProps}
              {...textFieldProps}
              label={label}
              error={!!errorMessage}
              helperText={errorMessage || ""}
              fullWidth
            />
          )}
        </InputMask>
      )}
    />
  );
};
