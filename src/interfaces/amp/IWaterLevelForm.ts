export interface IWaterLevelForm {
    PointID: string;
    DepthToWaterBGS: number;
    MeasurementDate: Date;
    LevelStatus: string;
    DataQuality: string;
    MeasuredBy: string;
    Notes: string;
    MPHeight: number;
    MeasurementMethod: string;
}