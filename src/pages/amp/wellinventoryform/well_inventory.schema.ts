import * as Yup from "yup";

export const WellInventorySchema = Yup.object().shape({
  project: Yup.object({
    pointid_prefix: Yup.string().required("PointId Prefix is required."),
    project: Yup.string().required("Project Name is required."),
    pointid: Yup.string().nonNullable(),
  }),
  location: Yup.object({
    site_id: Yup.string().nullable(),
    alternate_site_id: Yup.string().nullable(),
    site_name: Yup.string().nullable(),
    public_release: Yup.boolean().oneOf(
      [true],
      "Public Release must be accepted.",
    ),
    coordinates: Yup.object({
      type: Yup.mixed().oneOf(["utm", "gcs"]),
      x: Yup.number()
        .required("X coordinate is required.")
        .typeError("X coordinate must be a valid number."),
      y: Yup.number()
        .required("Y coordinate is required.")
        .typeError("Y coordinate must be a valid number."),
    }),
    altitude: Yup.number()
      .nullable()
      // .transform((value, originalValue) =>
      //   originalValue === "" || originalValue === 0 ? null : value,
      // )
      .typeError("Altitude must be a valid number."),
    utm_zone: Yup.number()
      .typeError("UTM Zone must be a valid number.")
      .required("UTM Zone is required.")
      .min(1, "UTM Zone must be at least 1.")
      .max(60, "UTM Zone must be at most 60."),
    utm_datum: Yup.string().required("UTM Datum is required."),
    alt_datum: Yup.string().nullable(),
    // .transform((value, originalValue) =>
    //   originalValue === "" ? null : value,
    // )
    // .when("altitude", (altitude, schema) =>
    //   altitude !== null && altitude !== undefined
    //     ? schema.required(
    //         "Altitude Datum is required when altitude is provided.",
    //       )
    //     : schema,
    // ),
    location_notes: Yup.string().nullable(),
    altitude_method: Yup.string().nullable(),
    // .transform((value, originalValue) =>
    //   originalValue === "" ? null : value,
    // )
    // .when("altitude", (altitude, schema) =>
    //   altitude !== null && altitude !== undefined
    //     ? schema.required(
    //         "Altitude Datum is required when altitude is provided.",
    //       )
    //     : schema,
    // ),
    site_type: Yup.string().required("Site Type is required."),
  }),
  well: Yup.object({
    hole_depth: Yup.number()
      .nullable()
      .typeError("Hole depth must be a valid number.")
      .min(0, "Hole depth must be positive."),
    well_depth: Yup.number()
      .nullable()
      .typeError("Well depth must be a valid number.")
      .min(0, "Well depth must be positive."),
    ose_well_id: Yup.string().nullable(),
    ose_welltag_id: Yup.string().nullable(),
    measuring_point: Yup.string().nullable(),
    mp_height: Yup.number()
      .nullable()
      .typeError("Measuring Point Height must be a valid number."),
    casing_diameter: Yup.number()
      .nullable()
      .typeError("Casing Diameter must be a valid number.")
      .min(0, "Casing Diameter must be positive."),
    casing_depth: Yup.number()
      .nullable()
      .typeError("Casing Depth must be a valid number.")
      .min(0, "Casing Depth must be positive."),
    casing_description: Yup.string().nullable(),
    construction_notes: Yup.string().nullable(),
    formation: Yup.string().nullable(),
    static_water: Yup.number()
      .nullable()
      .typeError("Static Water Level must be a valid number.")
      .min(0, "Static Water Level must be positive."),
    data_source: Yup.string().nullable(),
    monitoring_status: Yup.array().of(Yup.string()).nullable(),
    water_notes: Yup.string().nullable(),
    status_user_notes: Yup.string().nullable(),
    notes: Yup.string().nullable(),
    monitor_ok: Yup.boolean().nullable(),
    sample_ok: Yup.boolean().nullable(),
    open_well_logger_ok: Yup.boolean().nullable(),
  }),
  owner: Yup.object({
    owner_key: Yup.string().required("Owner Key is required."),
    first_name: Yup.string().nullable(),
    last_name: Yup.string().nullable(),
    email: Yup.string().email("Invalid email format.").nullable(),
    cell_phone: Yup.string()
      .nullable()
      .test(
        "phone-format",
        "Invalid Phone format",
        (value) => !value || /^[0-9]{10}$/.test(value),
      ),
    phone: Yup.string()
      .nullable()
      .test(
        "phone-format",
        "Invalid Phone format",
        (value) => !value || /^[0-9]{10}$/.test(value),
      ),
    mailing_address: Yup.string().nullable(),
    mail_city: Yup.string().nullable(),
    mail_state: Yup.string()
      .length(2, "State must be 2 characters.")
      .nullable(),
    mail_zip_code: Yup.string()
      .nullable()
      .test(
        "zip-code-format",
        "Invalid ZIP Code format.",
        (value) => !value || /^[0-9]{5}(-[0-9]{4})?$/.test(value),
      ),
    physical_address: Yup.string().nullable(),
    physical_city: Yup.string().nullable(),
    physical_state: Yup.string()
      .length(2, "State must be 2 characters")
      .nullable(),
    physical_zip_code: Yup.string()
      .nullable()
      .test(
        "zip-code-format",
        "Invalid ZIP Code format.",
        (value) => !value || /^[0-9]{5}(-[0-9]{4})?$/.test(value),
      ),
    second_last_name: Yup.string().nullable(),
    second_first_name: Yup.string().nullable(),
    second_ctct_email: Yup.string().email("Invalid email format.").nullable(),
    second_ctct_phone: Yup.string()
      .nullable()
      .test(
        "phone-format",
        "Invalid Phone format.",
        (value) => !value || /^[0-9]{10}$/.test(value),
      ),
  }),
});

export const SchemaDefaults = {
  project: {
    pointid_prefix: "",
    project: "",
    pointid: "",
  },
  location: {
    site_id: "",
    alternate_site_id: "",
    site_names: "",
    public_release: true,
    coordinates: {
      type: "utm",
      x: 0,
      y: 0,
    },
    altitude: 2842,
    utm_zone: 13,
    utm_datum: "NAD83",
    alt_datum: "",
    location_notes: "",
    altitude_method: "",
    site_type: "GW",
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
    data_source: "",
    monitoring_status: [],
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
