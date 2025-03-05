import * as Yup from "yup";

export const WellInventorySchema = Yup.object().shape({
  project: Yup.object({
    pointid_prefix: Yup.string().required("Point ID Prefix is required"),
    project: Yup.string().required("Project name is required"),
  }),
  location: Yup.object({
    site_id: Yup.string().required("Site ID is required"),
    alternate_site_id: Yup.string().nullable(),
    site_name: Yup.string().required("Site Name is required"),
    public_release: Yup.boolean()
      .oneOf([true], "Public Release must be accepted")
      .required("Public Release answer is required"),
    coordinates: Yup.object({
      type: Yup.mixed()
        .oneOf(["utm", "gcs"])
        .required("Coordinate type is required"),
      x: Yup.number().required("X coordinate is required"),
      y: Yup.number().required("Y coordinate is required"),
    }),
    altitude: Yup.number().required("Altitude is required"),
    utm_datum: Yup.string().required("UTM Datum is required"),
    alt_datum: Yup.string().required("Altitude Datum is required"),
    location_notes: Yup.string().nullable(),
    altitude_method: Yup.string().required("Altitude Method is required"),
    site_type: Yup.string().required("Site Type is required"),
  }),
  well: Yup.object({
    hole_depth: Yup.number()
      .min(0, "Hole depth must be positive")
      .required("Hole depth is required"),
    well_depth: Yup.number()
      .min(0, "Well depth must be positive")
      .required("Well depth is required"),
    ose_well_id: Yup.string().nullable(),
    ose_welltag_id: Yup.string().nullable(),
    measuring_point: Yup.string().required("Measuring Point is required"),
    mp_height: Yup.number()
      .min(0, "Measuring Point Height must be positive")
      .required("Measuring Point Height is required"),
    casing_diameter: Yup.number()
      .min(0, "Casing Diameter must be positive")
      .required("Casing Diameter is required"),
    casing_depth: Yup.number()
      .min(0, "Casing Depth must be positive")
      .required("Casing Depth is required"),
    casing_description: Yup.string().nullable(),
    construction_notes: Yup.string().nullable(),
    formation: Yup.string().required("Formation is required"),
    static_water: Yup.number()
      .min(0, "Static Water Level must be positive")
      .required("Static Water Level is required"),
    data_source: Yup.number()
      .min(0, "Data Source must be a valid number")
      .required("Data Source is required"),
    monitoring_status: Yup.string().required("Monitoring Status is required"),
    water_notes: Yup.string().nullable(),
    status_user_notes: Yup.string().nullable(),
    notes: Yup.string().nullable(),
    monitor_ok: Yup.boolean().required("Monitor OK status is required"),
    sample_ok: Yup.boolean().required("Sample OK status is required"),
    open_well_logger_ok: Yup.boolean().required(
      "Open Well Logger OK status is required",
    ),
  }),
  owner: Yup.object({
    owner_key: Yup.string().required("Owner Key is required"),
    first_name: Yup.string().required("First Name is required"),
    last_name: Yup.string().required("Last Name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    cell_phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Invalid Cell Phone format")
      .required("Cell Phone is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Invalid Phone format")
      .nullable(),
    mailing_address: Yup.string(),
    mail_city: Yup.string(),
    mail_state: Yup.string().length(2, "State must be 2 characters"),
    mail_zip_code: Yup.string().matches(
      /^[0-9]{5}(-[0-9]{4})?$/,
      "Invalid ZIP Code format",
    ),
    physical_address: Yup.string().required("Physical Address is required"),
    physical_city: Yup.string().required("Physical City is required"),
    physical_state: Yup.string()
      .length(2, "State must be 2 characters")
      .required("Physical State is required"),
    physical_zip_code: Yup.string()
      .matches(/^[0-9]{5}(-[0-9]{4})?$/, "Invalid ZIP Code format")
      .required("Physical ZIP Code is required"),
    second_last_name: Yup.string().nullable(),
    second_first_name: Yup.string().nullable(),
    second_ctct_email: Yup.string().email("Invalid email format").nullable(),
    second_ctct_phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Invalid Phone format")
      .nullable(),
  }),
});

export const SchemaDefaults = {
  project: {
    pointid_prefix: "",
    project: "",
  },
  location: {
    site_id: "",
    alternate_site_id: "",
    site_names: "",
    public_release: false,
    coordinates: {
      type: "gcs",
      x: 0,
      y: 0,
    },
    altitude: 0,
    utm_datum: "",
    alt_datum: "",
    location_notes: "",
    altitude_method: "",
    site_type: "",
  },
  well: {
    hole_depth: 0,
    well_depth: 0,
    ose_well_id: "",
    ose_welltag_id: "",
    measuring_point: "",
    mp_height: 0,
    casing_diameter: 0,
    casing_depth: 0,
    casing_description: "",
    construction_notes: "",
    formation: "",
    static_water: 0,
    data_source: 0,
    monitoring_status: "",
    water_notes: "",
    status_user_notes: "",
    notes: "",
    monitor_ok: true,
    sample_ok: true,
    open_well_logger_ok: true,
  },
  owner: {
    owner_key: "",
    first_name: "",
    last_name: "",
    email: "",
    cell_phone: "",
    phone: "",
    mailing_address: "",
    mail_city: "",
    mail_state: "NM",
    mail_zip_code: "",
    physical_address: "",
    physical_city: "",
    physical_state: "NM",
    physical_zip_code: "",
    second_last_name: "",
    second_first_name: "",
    second_ctct_email: "",
    second_ctct_phone: "",
  },
};
