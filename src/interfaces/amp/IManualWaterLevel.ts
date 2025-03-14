export interface IManualWaterLevel {
  PointID: string;
  PublicRelease: boolean;
  MeasurementDate: string;
  DepthToWaterBGS: number;
  MeasuringAgency: string;
  LevelStatus: string;
  DataQuality: string;
  DataSource: string;
  MeasuredBy: string;
  SiteNotes: string;
}
