import { FormControl, InputAdornment, InputLabel } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import React from "react";

type IClearableSelect = {
  label: string;
  value: string | string[];
  setValue: (value: any) => void;
  values: string[];
  multiple?: boolean;
  disabled?: boolean;
  showClear?: boolean;
  onClear?: () => void;
};

export const ClearableSelect: React.FC<IClearableSelect> = ({
  label,
  value,
  setValue,
  values,
  multiple = false,
  disabled = false,
  showClear = true,
  onClear = undefined,
}) => {
  let clear = false;
  if (showClear) {
    if (multiple) {
      clear = value.length > 0;
    } else {
      clear = value !== "";
    }
  }

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select<string | string[]>
        disabled={disabled}
        multiple={multiple}
        variant={"outlined"}
        label={label}
        value={value}
        onChange={(e: SelectChangeEvent<string | string[]>) => {
          setValue(e.target.value);
        }}
        endAdornment={
          clear && (
            <InputAdornment sx={{ marginRight: "15px" }} position="end">
              <IconButton
                onClick={() => {
                  if (onClear) {
                    onClear();
                  } else {
                    if (multiple) {
                      setValue([]);
                    } else {
                      setValue("");
                    }
                  }
                }}
              >
                <ClearIcon fontSize="small"></ClearIcon>
              </IconButton>
            </InputAdornment>
          )
        }
      >
        {values.map((lt) => {
          return (
            <MenuItem key={lt} value={lt}>
              {lt}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
