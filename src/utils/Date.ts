import { APP_TIMEZONE } from "@/config";
import type { ChemistryDisplayResponse } from "@/interfaces/ocotillo";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const formatAppDateTime = (
  isoUtc: string | null | undefined,
): string => {
  if (!isoUtc) return "";
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

// Date only -- for fields like first_visit_date and well_completion_date
// where the time component is not meaningful.
// Handles both YYYY-MM-DD strings (parsed as UTC noon to avoid timezone shift)
// and full ISO datetime strings.
export const formatAppDate = (value: string | null | undefined): string => {
  if (!value) return "";

  const dateOnlyMatch = value.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const d = new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), 12),
    );

    return new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

export const formatChemistryDate = (value: unknown): string => {
  if (!value) return "";

  const stringValue = String(value);
  return formatAppDate(stringValue) || stringValue;
};

export const formatDateForEndpoint = (
  value: string,
  endOfRange = false,
): string | undefined => {
  if (!value) return undefined;

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;

  if (endOfRange) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date.toISOString();
};

export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const collectionDateForInput = (value: unknown): string => {
  if (!value) return "";

  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? "";
};

export const dateTime = (value: unknown): number => {
  if (!value) return 0;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const compareSamplesByCollectionDate = (
  a: ChemistryDisplayResponse["samples"][number],
  b: ChemistryDisplayResponse["samples"][number],
): number => {
  const aTime = dateTime(a.collection_date) || Number.POSITIVE_INFINITY;
  const bTime = dateTime(b.collection_date) || Number.POSITIVE_INFINITY;

  return aTime - bTime || a.id - b.id;
};
