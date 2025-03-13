import InputMask from "react-input-mask";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";

export const ControlledPhoneField = <T,>({
  control,
  name,
  label,
  ...textFieldProps
}: {
  control: Control<T>;
  name: string;
  label: string;
} & TextFieldProps) => {
  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <InputMask
          mask="(999)-999-9999"
          value={field.value || ""}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            field.onChange(event.target.value.replace(/\D/g, ""))
          }
        >
          {(textFieldProps) => (
            <TextField
              {...textFieldProps}
              label={label}
              error={!!fieldState?.error}
              helperText={fieldState?.error?.message || ""}
              fullWidth
            />
          )}
        </InputMask>
      )}
    />
  );
};
