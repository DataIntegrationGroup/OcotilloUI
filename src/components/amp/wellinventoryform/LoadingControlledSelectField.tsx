import {
  ControlledSelectField,
  SkeletonFormField,
  ErrorAlertFormField,
} from "@/components";
import { Clear } from "@mui/icons-material";
import { Box, Button, SelectProps, Tooltip } from "@mui/material";
import { Control } from "react-hook-form";

export const LoadingControlledSelectField = <T,>({
  isLoading,
  isError,
  errorMessage,
  options,
  control,
  label,
  name,
  required,
  resetFn,
  multiple = false,
  ...props
}: {
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  options: { value: string; label: string }[];
  control: Control<T>;
  name: string;
  label: string;
  required?: boolean;
  resetFn: () => void;
  multiple?: boolean;
} & SelectProps) => {
  const { disabled } = props;

  if (isLoading) return <SkeletonFormField />;

  if (isError) return <ErrorAlertFormField message={errorMessage} />;

  return (
    <Box alignItems="center" sx={{ display: "flex" }}>
      <Tooltip title="Clear selection">
        <Button
          variant="outlined"
          disabled={disabled}
          onClick={resetFn}
          sx={{
            borderBottomRightRadius: 0,
            borderTopRightRadius: 0,
            height: 55,
            width: 30,
            minWidth: "auto",
            paddingLeft: 2.5,
            paddingRight: 2.5,
          }}
        >
          <Clear />
        </Button>
      </Tooltip>
      <ControlledSelectField
        sx={{
          borderBottomLeftRadius: 0,
          borderTopLeftRadius: 0,
          height: 55,
          flexGrow: 1,
        }}
        options={options}
        control={control}
        label={label}
        name={name}
        required={required}
        multiple={multiple}
        {...props}
      />
    </Box>
  );
};
