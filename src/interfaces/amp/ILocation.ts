import { IGeometry } from "@/interfaces/amp";

export interface ILocation {
  PointID: string;
  PublicRelease: boolean;
  Confidential: boolean;
  AlternateSiteID: string | null;
  elevation_method: string;
  Elevation: number;
  SiteNames: string;
  SiteID: string | null;
  Easting: number;
  Northing: number;
  State: string;
  County: string;
  geometry: IGeometry;
  utm_datum: string;
  utm_zone: number;
  altitude_datum: string;
  lonlat_datum: string;
  site_type: string;
  LocationNotes: string | null;
}
