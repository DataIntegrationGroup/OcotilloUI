import { useState } from "react";
import { Controller, Control, FormState, Path } from "react-hook-form";
import {
  TextField,
  TextFieldProps,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";
import axios from "axios";

export const ControlledOSMAddressAutocomplete = <T,>({
  control,
  name,
  label,
  errorMessage,
  onAddressSelect,
  ...textFieldProps
}: {
  control: Control<T>;
  formState: FormState<T>;
  name: Path<T>;
  label: string;
  errorMessage?: string;
  onAddressSelect?: (
    address: string,
    city: string,
    state: string,
    zip: string,
  ) => void;
} & TextFieldProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const fetchAddresses = async (value: string) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: value,
            format: "json",
            addressdetails: 1,
            limit: 5,
          },
        },
      );

      setSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div style={{ position: "relative" }}>
          <TextField
            {...field}
            {...textFieldProps}
            label={label}
            error={!!errorMessage}
            helperText={errorMessage || ""}
            fullWidth
            autoComplete="off"
            onChange={(e) => {
              field.onChange(e);
              fetchAddresses(e.target.value);
            }}
          />
          {suggestions.length > 0 && (
            <List
              sx={{
                position: "absolute",
                background: "white",
                zIndex: 10,
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                boxShadow: 1,
              }}
            >
              {suggestions.map((suggestion, index) => {
                const address = suggestion.display_name;
                const city =
                  suggestion.address?.city ||
                  suggestion.address?.town ||
                  suggestion.address?.village ||
                  "";
                const state = suggestion.address?.state || "";
                const zip = suggestion.address?.postcode || "";

                return (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      onClick={() => {
                        field.onChange(address);
                        setSuggestions([]);
                        if (onAddressSelect) {
                          onAddressSelect(address, city, state, zip);
                        }
                      }}
                    >
                      {address}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </div>
      )}
    />
  );
};
