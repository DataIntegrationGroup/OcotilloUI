import type { IHydrographOptions } from "@/interfaces/st2";

export const transform = (
  v: number,
  ref: number,
  offset: number,
  options: IHydrographOptions,
) => {
  if (options != undefined) {
    if (options.useNormalization) {
      return v - ref;
    } else if (options.useCompact) {
      return v - ref + offset;
    }
  }

  return v;
};
