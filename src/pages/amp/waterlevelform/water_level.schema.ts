import * as Yup from "yup";

export const SchemaDefaults = {
    PointID: "",
    DepthToWaterBGS: 0,
    MeasurementDate: "",
    LevelStatus: "",
    DataQuality: "",
    MeasuredBy: "",
    Notes: "",
    MPHeight: 0,
    MeasurementMethod: "",
}

export const WaterLevelSchema = Yup.object().shape({
    PointID: Yup.string().required("Point ID is required"),
    DepthToWaterBGS: Yup.number().required("Depth to Water BGS is required"),
    MeasurementDate: Yup.string().required("Measurement Date is required"),
    LevelStatus: Yup.string().required("Level Status is required"),
    DataQuality: Yup.string().required("Data Quality is required"),
    MeasuredBy: Yup.string().required("Measured By is required"),
    Notes: Yup.string().required("Site Notes is required"),
    MPHeight: Yup.number().optional(),
    MeasurementMethod: Yup.date().required("Measurement Method is required"),

})
