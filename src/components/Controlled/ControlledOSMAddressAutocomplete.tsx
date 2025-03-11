import { useState, useCallback } from "react";
import { Controller, Control, FormState, Path } from "react-hook-form";
import {
  TextField,
  TextFieldProps,
  List,
  ListItem,
  ListItemButton,
  Paper,
} from "@mui/material";
import axios from "axios";
import debounce from "lodash.debounce";
import { STATE_ABBREVIATIONS } from "@/interfaces";

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
  const [isFocused, setIsFocused] = useState(false);

  const fetchAddresses = useCallback(
    debounce(async (value: string) => {
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
              countrycodes: "us", // Restrict to United States
              dedupe: 1, // Remove duplicate addresses
              bounded: 1, // Prefer commonly used locations
            },
          },
        );

        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    }, 750),
    [],
  );

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
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)} // Small delay to allow click selection
            onChange={(e) => {
              field.onChange(e);
              fetchAddresses(e.target.value);
            }}
          />
          {isFocused && suggestions.length > 0 && (
            <Paper
              sx={{
                position: "absolute",
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                boxShadow: 3,
                zIndex: 10,
              }}
            >
              <List>
                {suggestions.map((suggestion, index) => {
                  const address =
                    `${suggestion.address?.house_number || ""} ${suggestion.address?.road || ""}`.trim();
                  const city =
                    suggestion.address?.city ||
                    suggestion.address?.town ||
                    suggestion.address?.village ||
                    "";

                  const stateFull = suggestion.address?.state || "";
                  const stateAbbr = STATE_ABBREVIATIONS[stateFull] || stateFull; // Convert to abbreviation

                  const zip = suggestion.address?.postcode || "";

                  return (
                    <ListItem key={index} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          field.onChange(address);
                          setSuggestions([]);
                          setIsFocused(false);
                          if (onAddressSelect) {
                            onAddressSelect(address, city, stateAbbr, zip);
                          }
                        }}
                      >
                        {suggestion.display_name}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </div>
      )}
    />
  );
};
