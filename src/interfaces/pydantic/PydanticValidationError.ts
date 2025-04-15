import { PydanticErrorDetail } from "@/interfaces/pydantic";

export type PydanticValidationError = {
  detail: PydanticErrorDetail[];
};
