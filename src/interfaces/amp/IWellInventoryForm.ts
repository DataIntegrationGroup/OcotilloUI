import { Dayjs } from "dayjs";

export interface IWellInventoryForm {
  project: {
    pointid_prefix: string;
    project: string;
    date_time: Dayjs;
    field_staff: string;
  };
  location: {
    site_id: string;
    alternate_site_id: string | null;
    site_names: string;
    public_release: boolean;
    coordinates: {
      type: "utm" | "gcs";
      x: number;
      y: number;
    };
    altitude: number;
    utm_datum: string;
    alt_datum: string;
    location_notes: string | null;
    altitude_method: string;
    site_type: string;
  };
  well: {
    hole_depth: number;
    well_depth: number;
    ose_well_id: string | null;
    ose_welltag_id: string | null;
    measuring_point: string;
    mp_height: number;
    casing_diameter: number;
    casing_depth: number;
    casing_description: string | null;
    construction_notes: string | null;
    formation: string;
    static_water: number;
    data_source: number;
    monitoring_status: string;
    water_notes: string | null;
    status_user_notes: string | null;
    notes: string | null;
    monitor_ok: boolean;
    sample_ok: boolean;
    open_well_logger_ok: boolean;
  };
  owner: {
    owner_key: string;
    first_name: string;
    last_name: string;
    email: string;
    cell_phone: string;
    phone: string | null;
    mailing_address: string;
    mail_city: string;
    mail_state: string;
    mail_zip_code: string;
    physical_address: string;
    physical_city: string;
    physical_state: string;
    physical_zip_code: string;
    second_last_name: string | null;
    second_first_name: string | null;
    second_ctct_email: string | null;
    second_ctct_phone: string | null;
  };
}
