#!/usr/bin/env python3
"""Generate src/constants/usgsSiteDictionary.ts from the USGS OGC API reference lists.

The NWIS site service returns coded values (site_tp_cd=GW, topo_cd=V, ...) and
its RDB header supplies the column labels but not the meaning of the codes.
USGS publishes the code lists as reference collections on the Water Data OGC
API, so this script pulls them at build time and emits a lookup module. Nothing
is hand-written, and re-running the script picks up USGS revisions.

Usage:
    python3 scripts/generate_usgs_site_dictionary.py
    npx biome check --write src/constants/usgsSiteDictionary.ts

Requires network access to api.waterdata.usgs.gov.
"""

from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = REPO_ROOT / "src" / "constants" / "usgsSiteDictionary.ts"

API_ROOT = "https://api.waterdata.usgs.gov/ogcapi/v0/collections"
PAGE_SIZE = 5000

# Reference collections we pull, and how each one turns into { code: label }.
# `key` builds the lookup key from a feature's properties; `label` builds the
# decoded text. Collections with tens of thousands of entries (hydrologic units,
# local aquifer codes) are deliberately left out — those columns stay raw rather
# than adding megabytes to the bundle.
COLLECTIONS = {
    "agency-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("agency_name"),
    },
    "site-types": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("site_type_name"),
        "description": lambda p: p.get("site_type_description"),
    },
    "coordinate-accuracy-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("coordinate_accuracy_description"),
    },
    "coordinate-datum-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("coordinate_datum_description"),
    },
    "coordinate-method-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("coordinate_method_description"),
    },
    "altitude-datums": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("altitude_datum_description"),
    },
    "reliability-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("reliability_description"),
    },
    "topographic-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("topography_name"),
        "description": lambda p: p.get("short_topography_description"),
    },
    "aquifer-types": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("aquifer_type_description"),
    },
    "national-aquifer-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("national_aquifer_name"),
    },
    "time-zone-codes": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("time_zone_name"),
    },
    "countries": {
        "key": lambda p: p["id"],
        "label": lambda p: p.get("country_name"),
    },
    # State and county codes arrive as FIPS digits, so they are keyed by FIPS
    # rather than by the collection's own id. Limited to US entries; the site
    # service reports the country separately.
    "states": {
        "key": lambda p: p["state_fips_code"] if p.get("country_code") == "US" else None,
        "label": lambda p: p.get("state_name"),
    },
    "counties": {
        "key": lambda p: (
            f"{p['state_fips_code']}-{p['county_fips_code']}"
            if p.get("country_code") == "US"
            else None
        ),
        "label": lambda p: p.get("county_name"),
    },
}

# RDB column -> reference collection. Columns whose code list is not published
# (or is too large to bundle) are omitted and render as the raw code.
COLUMN_CODE_TABLES = {
    "agency_cd": "agency-codes",
    "site_tp_cd": "site-types",
    "coord_meth_cd": "coordinate-method-codes",
    "coord_acy_cd": "coordinate-accuracy-codes",
    "coord_datum_cd": "coordinate-datum-codes",
    "dec_coord_datum_cd": "coordinate-datum-codes",
    "alt_datum_cd": "altitude-datums",
    "reliability_cd": "reliability-codes",
    "topo_cd": "topographic-codes",
    "aqfr_type_cd": "aquifer-types",
    "nat_aqfr_cd": "national-aquifer-codes",
    "tz_cd": "time-zone-codes",
    "country_cd": "countries",
    "state_cd": "states",
    "district_cd": "states",
}


def fetch_collection(collection: str) -> list[dict]:
    features: list[dict] = []
    offset = 0

    while True:
        query = urllib.parse.urlencode(
            {"f": "json", "limit": PAGE_SIZE, "offset": offset}
        )
        url = f"{API_ROOT}/{collection}/items?{query}"
        with urllib.request.urlopen(url, timeout=120) as response:
            payload = json.load(response)

        page = payload.get("features", [])
        features.extend(page)

        matched = payload.get("numberMatched")
        offset += len(page)
        if not page or matched is None or offset >= matched:
            break

    return features


def build_tables() -> dict[str, dict[str, dict[str, str]]]:
    tables: dict[str, dict[str, dict[str, str]]] = {}

    for collection, spec in COLLECTIONS.items():
        entries: dict[str, dict[str, str]] = {}
        for feature in fetch_collection(collection):
            properties = feature.get("properties") or {}
            key = spec["key"](properties)
            label = spec["label"](properties)
            if not key or not label:
                continue

            entry = {"label": label}
            describe = spec.get("description")
            description = describe(properties) if describe else None
            if description:
                entry["description"] = description
            entries[key] = entry

        print(f"  {collection}: {len(entries)} codes", file=sys.stderr)
        tables[collection] = entries

    return tables


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def render(tables: dict[str, dict[str, dict[str, str]]]) -> str:
    table_blocks = []
    for name, entries in tables.items():
        rows = []
        for code, entry in sorted(entries.items()):
            if "description" in entry:
                rows.append(
                    "    {}: {{ label: {}, description: {} }},".format(
                        json.dumps(code),
                        ts_string(entry["label"]),
                        ts_string(entry["description"]),
                    )
                )
            else:
                rows.append(
                    "    {}: {{ label: {} }},".format(
                        json.dumps(code), ts_string(entry["label"])
                    )
                )
        table_blocks.append(
            "  {}: {{\n{}\n  }},".format(json.dumps(name), "\n".join(rows))
        )

    column_rows = "\n".join(
        "  {}: {},".format(json.dumps(column), json.dumps(collection))
        for column, collection in sorted(COLUMN_CODE_TABLES.items())
    )

    return f"""// GENERATED FILE — do not edit by hand.
// Source: USGS Water Data OGC API reference collections
// ({API_ROOT}).
// Regenerate: python3 scripts/generate_usgs_site_dictionary.py
//
// The NWIS site service returns coded values and its RDB header supplies the
// column labels, but the code meanings live in these reference lists.

export type USGSCodeEntry = {{
  label: string
  description?: string
}}

export const USGS_CODE_TABLES: Record<string, Record<string, USGSCodeEntry>> = {{
{chr(10).join(table_blocks)}
}}

/** RDB column -> reference collection. Columns absent here render their raw code. */
export const USGS_COLUMN_CODE_TABLES: Record<string, string> = {{
{column_rows}
}}

/**
 * Decodes a coded site-file value, e.g. site_tp_cd "GW" -> "Well".
 * County codes need the state FIPS code, which the caller passes as `context`.
 */
export const decodeUSGSValue = (
  column: string,
  value: unknown,
  context?: {{ stateFips?: string }}
): USGSCodeEntry | null => {{
  const raw = value == null ? '' : String(value).trim()
  if (!raw) return null

  if (column === 'county_cd') {{
    const stateFips = context?.stateFips?.trim()
    if (!stateFips) return null
    return USGS_CODE_TABLES['counties'][`${{stateFips}}-${{raw}}`] ?? null
  }}

  const collection = USGS_COLUMN_CODE_TABLES[column]
  if (!collection) return null

  return USGS_CODE_TABLES[collection][raw] ?? null
}}
"""


def main() -> int:
    print("Fetching USGS reference collections...", file=sys.stderr)
    tables = build_tables()
    OUTPUT_PATH.write_text(render(tables), encoding="utf-8")
    total = sum(len(entries) for entries in tables.values())
    print(f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} ({total} codes)")
    print(f"  Now run: npx biome check --write {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
