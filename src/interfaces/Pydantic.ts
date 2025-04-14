export type PydanticErrorDetail = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type PydanticValidationError = {
  detail: PydanticErrorDetail[];
};
