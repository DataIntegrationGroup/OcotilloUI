import { useState, useCallback } from "react";
import { Controller, Control, Path } from "react-hook-form";
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
import { settings } from "@/settings";
import { useQuery } from "@tanstack/react-query";

const fetchAddresses = async (query: string) => {
  if (!query) return [];
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query,
    )}.json`,
    {
      params: {
        access_token: settings.mapboxToken,
        country: "us",
        types: "address",
        limit: 5,
      },
    },
  );
  return response.data.features;
};

export const ControlledMapboxAddressAutocomplete = <T,>({
  control,
  name,
  label,
  onAddressSelect,
  ...textFieldProps
}: {
  control: Control<T>;
  name: string;
  label: string;
  onAddressSelect?: (
    address: string,
    city: string,
    state: string,
    zip: string,
  ) => void;
} & TextFieldProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["addresses", query],
    queryFn: () => fetchAddresses(query),
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const debouncedSetQuery = debounce(setQuery, 500);

  return (
    <Controller
      name={name as Path<T>}
      control={control}
      render={({ field, fieldState }) => (
        <div style={{ position: "relative" }}>
          <TextField
            {...field}
            {...textFieldProps}
            label={label}
            error={!!fieldState?.error}
            helperText={fieldState?.error?.message || ""}
            fullWidth
            autoComplete="off"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            onChange={(e) => {
              field.onChange(e);
              debouncedSetQuery(e.target.value);
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
                {suggestions.map(
                  (
                    suggestion: {
                      place_name: string;
                      address?: string;
                      center: [number, number];
                      context?: {
                        id: string;
                        text: string;
                        short_code?: string;
                      }[];
                    },
                    index: number,
                  ) => {
                    const placeName = suggestion.place_name;
                    const address =
                      placeName.split(",")[0] || suggestion.address || "";
                    const city =
                      suggestion.context?.find((c: any) =>
                        c.id.startsWith("place"),
                      )?.text || "";
                    const stateFull =
                      suggestion.context?.find((c: any) =>
                        c.id.startsWith("region"),
                      )?.text || "";
                    const stateAbbr =
                      suggestion.context
                        ?.find((c: any) => c.id.startsWith("region"))
                        ?.short_code?.split("-")[1] || stateFull;
                    const zip =
                      suggestion.context?.find((c: any) =>
                        c.id.startsWith("postcode"),
                      )?.text || "";

                    return (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          onClick={() => {
                            field.onChange(address);
                            setQuery("");
                            setIsFocused(false);
                            if (onAddressSelect) {
                              onAddressSelect(address, city, stateAbbr, zip);
                            }
                          }}
                        >
                          {placeName}
                        </ListItemButton>
                      </ListItem>
                    );
                  },
                )}
              </List>
            </Paper>
          )}
        </div>
      )}
    />
  );
};
