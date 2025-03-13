import { TextField, Autocomplete } from "@mui/material";
import { Controller, Control, Path } from "react-hook-form";
import { useState } from "react";

const emailDomains = [
  "@nmt.edu",
  "@gmail.com",
  "@outlook.com",
  "@yahoo.com",
  "@icloud.com",
];

export const ControlledEmailField = <T,>({
  control,
  name,
  label,
  ...textFieldProps
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) => {
  const [_, setInputValue] = useState("");

  const getSuggestions = (value: string) => {
    const [localPart, domain] = value.split("@");
    return emailDomains
      .filter((d) => !domain || d.includes(domain))
      .map((d) => `${localPart}${d}`);
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          freeSolo
          disableClearable
          options={getSuggestions(field.value || "")}
          onInputChange={(_, newValue) => {
            setInputValue(newValue);
            field.onChange(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textFieldProps}
              label={label}
              error={!!fieldState?.error}
              helperText={fieldState?.error?.message || ""}
              fullWidth
            />
          )}
        />
      )}
    />
  );
};
