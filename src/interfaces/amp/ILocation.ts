export interface ILocation {
  PointID: string;
  SiteID: string;
  PublicRelease: boolean;
  geometry: { coordinates: number[]; type: string };
  Easting: number;
  Northing: number;
  site_type: string;
}
