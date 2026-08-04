#!/usr/bin/env python3
"""Generate src/constants/osePodDictionary.ts from the NM OSE WATERS PODs data dictionary.

The OSE publishes the dictionary as a workbook with a "Data Dictionary" sheet
(one row per column of the WATERS_PODs table) and a "Code Tables" sheet (the
coded-value lookups those columns reference). The ArcGIS feature service we
query exposes the same columns, but truncated to 10 characters and with
reserved words suffixed with an underscore, so this script also resolves the
service field name for each dictionary column.

Usage:
    python3 scripts/generate_ose_pod_dictionary.py path/to/nmose_WATERS_PODs_data_dictionary_v8.xlsx
    npx biome check --write src/constants/osePodDictionary.ts

Requires openpyxl (pip install openpyxl).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = REPO_ROOT / "src" / "constants" / "osePodDictionary.ts"

# Feature service the app queries. Its field names are the join key, so they are
# listed here rather than fetched, keeping generation offline and deterministic.
SERVICE_FIELDS = """
OBJECTID pod_basin pod_nbr pod_suffix ref pod_name tws rng sec qtr_4th qtr_16th
qtr_64th blk zone_ x y landgrant legal county license_nb start_date finish_dat
plug_date pcw_rcv_da elevation depth_well grnd_wtr_s percent_sh depth_wate
log_file_d sched_date use_of_wel pump_type pump_seria discharge aquifer sys_date
subdiv_nam subdiv_loc restrict_ lat_deg lat_min lat_sec lon_deg lon_min lon_sec
surface_co estimate_y pod_status casing_siz ditch_name utm_zone easting northing
datum utm_source utm_accura xy_source xy_accurac lat_lon_so lat_lon_ac tract_nbr
map_nbr surv_map other_loc pod_rec_nb cfs_start_ cfs_end_md cfs_cnv_fa cs_code
wrats_s_id utm_error pod_sub_ba well_tag static_lev pod_file sum_rec_nb basin nbr
suffix sub_basin status use_ total_div sub_file sf_header db_file own_lname
own_fname addr1 addr2 city state zip contact_ln contact_fn nmwrrs_wrs in_state
dump_date loc_error wr_count replaced metered
""".split()

# ArcGIS renames columns that collide with reserved words, which truncation
# alone cannot recover.
FIELD_OVERRIDES = {
    "landgrant": "GRANT",
    "zone_": "ZONE",
    "use_": "USE",
    "restrict_": "RESTRICT",
}

# Service fields with no counterpart in the dictionary. Listed explicitly so a
# future dictionary revision that adds them shows up as a diff instead of
# silently staying undocumented.
UNDOCUMENTED_FIELDS = {"license_nb", "metered", "dump_date"}

# Labels the word-by-word expansion below cannot produce correctly, either
# because the column name is ambiguous (LAT_SEC is seconds, SEC is a PLSS
# section) or because it is abbreviated past recognition.
LABEL_OVERRIDES = {
    "ADDR1": "Address Line 1",
    "ADDR2": "Address Line 2",
    "BLK": "Block",
    "CFS_END_MDAY": "CFS End (Month/Day)",
    "CFS_START_MDAY": "CFS Start (Month/Day)",
    "CONTACT_FNAME": "Contact First Name",
    "CONTACT_LNAME": "Contact Last Name",
    "DB_FILE": "Water Right File",
    "DEPTH_WATER": "Depth to Water",
    "DEPTH_WELL": "Well Depth",
    "DISCHARGE": "Discharge Pipe Size",
    "ESTIMATE_YIELD": "Estimated Yield",
    "GRANT": "Land Grant",
    "GRND_WTR_SRC": "Groundwater Source Type",
    "IN_STATE": "In-State Flag",
    "LAT_DEG": "Latitude Degrees",
    "LAT_MIN": "Latitude Minutes",
    "LAT_SEC": "Latitude Seconds",
    "LEGAL": "Legal Description",
    "LOC_ERROR": "Location Error",
    "LOG_FILE_DATE": "Well Record Filed Date",
    "LON_DEG": "Longitude Degrees",
    "LON_MIN": "Longitude Minutes",
    "LON_SEC": "Longitude Seconds",
    "NBR": "File Number",
    "OTHER_LOC": "Other Location",
    "OWN_FNAME": "Owner First Name",
    "OWN_LNAME": "Owner Last Name",
    "PCW_RCV_DATE": "Proof of Completion Received",
    "POD_FILE": "POD File Number",
    "QTR_16TH": "Quarter (1/16 Section)",
    "QTR_4TH": "Quarter (1/4 Section)",
    "QTR_64TH": "Quarter (1/64 Section)",
    "REF": "Reference",
    "RESTRICT": "Diversion Restriction",
    "SCHED_DATE": "Well Schedule Date",
    "SF_HEADER": "Adjudication Subfile Header",
    "STATIC_LEVEL": "Static Water Level",
    "SUB_FILE": "Adjudication Subfile",
    "SUFFIX": "File Suffix",
    "SUM_REC_NBR": "Water Right Record Number",
    "SURFACE_CODE": "Surface Water Source",
    "SURV_MAP": "Survey Map Name",
    "TOTAL_DIV": "Total Diversion",
    "UTM_ERROR": "UTM Conversion Error",
    "WRATS_S_ID": "WRATS POD ID",
    "WR_COUNT": "Water Right File Count",
    "X": "X Coordinate",
    "Y": "Y Coordinate",
    "ZIP": "ZIP Code",
    "ZONE": "State Plane Zone",
}

# Applied word-by-word when turning a column name into a display label.
ABBREVIATIONS = {
    "acc": "Accuracy",
    "cfs": "CFS",
    "cnv": "Conversion",
    "cs": "Coordinate System",
    "db": "DB",
    "id": "ID",
    "lat": "Latitude",
    "lon": "Longitude",
    "mday": "Month/Day",
    "nbr": "Number",
    "nmwrrs": "NMWRRS",
    "objectid": "Object ID",
    "plss": "PLSS",
    "pod": "POD",
    "qtr": "Quarter",
    "rec": "Record",
    "rng": "Range",
    "sec": "Section",
    "sf": "Subfile",
    "src": "Source",
    "srv": "Survey",
    "sub": "Sub",
    "subdiv": "Subdivision",
    "sum": "Summary",
    "surv": "Survey",
    "sys": "System",
    "tws": "Township",
    "url": "URL",
    "utm": "UTM",
    "wr": "Water Right",
    "wrats": "WRATS",
    "wrsum": "Water Right Summary",
    "xy": "XY",
}


def read_rows(sheet) -> list[list[str]]:
    return [
        ["" if cell is None else str(cell).strip() for cell in row]
        for row in sheet.iter_rows(values_only=True)
    ]


def parse_data_dictionary(sheet) -> dict[str, dict[str, str]]:
    rows = read_rows(sheet)
    header_index = next(i for i, row in enumerate(rows) if row and row[0] == "Column Name")
    header = rows[header_index]

    columns: dict[str, dict[str, str]] = {}
    for row in rows[header_index + 1 :]:
        if not row or not row[0]:
            continue
        record = {header[i]: row[i] for i in range(len(header))}
        columns[record["Column Name"]] = record

    return columns


def parse_code_tables(sheet) -> dict[str, dict[str, object]]:
    tables: dict[str, dict[str, object]] = {}
    current: str | None = None
    in_values = False

    for row in read_rows(sheet):
        code = row[0] if row else ""
        label = row[1] if len(row) > 1 else ""

        if code.lower().startswith("code table:"):
            current = code.split(":", 1)[1].strip()
            tables[current] = {"description": "", "values": {}}
            in_values = False
            continue

        if current is None:
            continue

        if code == "Code Value":
            in_values = True
            continue

        if not in_values:
            if code and not tables[current]["description"]:
                tables[current]["description"] = code
            continue

        if code or label:
            tables[current]["values"][code] = label

    return tables


def resolve_column(service_field: str, columns: dict[str, dict[str, str]]) -> str | None:
    """Map an ArcGIS service field back to its dictionary column name."""
    if service_field in UNDOCUMENTED_FIELDS:
        return None
    if service_field in FIELD_OVERRIDES:
        return FIELD_OVERRIDES[service_field]

    upper = service_field.upper()
    if upper in columns:
        return upper

    # The service truncates long column names to 10 characters.
    candidates = sorted(
        (column for column in columns if column.startswith(upper)), key=len
    )
    return candidates[0] if candidates else None


def to_label(column: str) -> str:
    if column in LABEL_OVERRIDES:
        return LABEL_OVERRIDES[column]

    words = [word for word in re.split(r"[_\s]+", column.lower()) if word]
    return " ".join(ABBREVIATIONS.get(word, word.capitalize()) for word in words)


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render(columns: dict[str, dict[str, str]], code_tables: dict, source_name: str) -> str:
    field_entries = []
    missing = []

    for service_field in SERVICE_FIELDS:
        column = resolve_column(service_field, columns)
        if column is None:
            missing.append(service_field)
            continue

        record = columns[column]
        code_table = record.get("Valid Values /     Code Table", "").strip().upper()
        if code_table and code_table not in code_tables:
            code_table = ""

        field_entries.append(
            "  {}: {{\n"
            "    column: {},\n"
            "    label: {},\n"
            "    description: {},\n"
            "    dataType: {},\n"
            "    codeTable: {},\n"
            "  }},".format(
                json.dumps(service_field),
                ts_string(column),
                ts_string(to_label(column)),
                ts_string(record.get("Brief Description", "").strip()),
                ts_string(record.get("Data Type", "").strip()),
                ts_string(code_table) if code_table else "null",
            )
        )

    table_entries = []
    for name, table in sorted(code_tables.items()):
        values = "\n".join(
            "      {}: {},".format(json.dumps(code), ts_string(label))
            for code, label in table["values"].items()
        )
        table_entries.append(
            "  {}: {{\n"
            "    description: {},\n"
            "    values: {{\n{}\n    }},\n"
            "  }},".format(json.dumps(name), ts_string(table["description"]), values)
        )

    fields_block = "\n".join(field_entries)
    tables_block = "\n".join(table_entries)
    missing_note = ", ".join(sorted(missing)) or "none"

    return f"""// GENERATED FILE — do not edit by hand.
// Source: {source_name} (NM OSE WATERS PODs data dictionary).
// Regenerate: python3 scripts/generate_ose_pod_dictionary.py <path-to-xlsx>
//
// Keys are the field names returned by the OSE Points of Diversion feature
// service, which truncates the dictionary's column names to 10 characters.
// Service fields with no entry in this dictionary revision: {missing_note}.

export type OSEPODCodeTable = {{
  description: string
  values: Record<string, string>
}}

export type OSEPODFieldDefinition = {{
  /** Column name in the OSE WATERS_PODs table. */
  column: string
  /** Short human-readable label for the field. */
  label: string
  /** The dictionary's brief description of the field. */
  description: string
  dataType: string
  /** Key into OSE_POD_CODE_TABLES when the field holds a coded value. */
  codeTable: string | null
}}

export const OSE_POD_CODE_TABLES: Record<string, OSEPODCodeTable> = {{
{tables_block}
}}

export const OSE_POD_FIELDS: Record<string, OSEPODFieldDefinition> = {{
{fields_block}
}}

/** Decodes a coded value using the field's code table, falling back to the raw value. */
export const decodeOSEPODValue = (
  field: string,
  value: unknown
): string | null => {{
  if (value == null || value === '') return null

  const definition = OSE_POD_FIELDS[field]
  const table = definition?.codeTable
    ? OSE_POD_CODE_TABLES[definition.codeTable]
    : undefined

  return table?.values[String(value).trim()] ?? String(value)
}}
"""


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    source = Path(sys.argv[1])
    workbook = openpyxl.load_workbook(source, data_only=True)
    columns = parse_data_dictionary(workbook["Data Dictionary"])
    code_tables = parse_code_tables(workbook["Code Tables"])

    OUTPUT_PATH.write_text(render(columns, code_tables, source.name), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    print(f"  {len(columns)} dictionary columns, {len(code_tables)} code tables")
    print(f"  Now run: npx biome check --write {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
