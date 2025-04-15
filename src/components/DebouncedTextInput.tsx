import { InputAdornment, TextField } from "@mui/material";
import React, { useState } from "react";
import { useDebounce } from "@/components/util";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export const DebouncedTextInput: React.FC<{
  value: any;
  setValue: any;
  options?: any;
  clear?: boolean;
  delay?: number;
}> = ({ value, setValue, options, delay = 500 }) => {
  const [inputValue, setInputValue] = useState(value);

  const debounced = useDebounce((v: any) => {
    setValue(v);
  }, delay);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    debounced(event.target.value);
  };

  const onClear = () => {
    setInputValue("");
    setValue("");
  };

  if (!options) {
    options = { label: "Value", variant: "outlined" };
  }

  return (
    <TextField
      {...options}
      value={inputValue}
      onChange={handleValueChange}
      InputProps={{
        endAdornment: inputValue ? (
          <InputAdornment sx={{ marginRight: "15px" }} position="end">
            <IconButton
              onClick={() => {
                onClear();
              }}
            >
              <ClearIcon fontSize="small"></ClearIcon>
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
};
