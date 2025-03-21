import {
  ControlledSelectField,
  SkeletonFormField,
  ErrorAlertFormField,
} from "@/components";
import { SelectProps } from "@mui/material";
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
} & SelectProps) => {
  if (isLoading) return <SkeletonFormField />;

  if (isError) return <ErrorAlertFormField message={errorMessage} />;

  return (
    <ControlledSelectField
      options={options}
      control={control}
      label={label}
      name={name}
      required={required}
      {...props}
    />
  );
};
