import proj4 from "proj4";

export const convertUTMToLonLat = (
  x: number,
  y: number,
  zone?: number,
): [number, number] => {
  let finalZone = zone;

  if (!zone || isNaN(zone)) {
    console.warn(
      "UTM zone is missing or invalid — defaulting to zone 13 (Western US)",
    );
    finalZone = 13;
  }

  const utmProj = `+proj=utm +zone=${finalZone} +datum=WGS84 +units=m +no_defs`;
  return proj4(utmProj, "EPSG:4326", [x, y]);
};

export const convertLonLatToUTM = (
  lon: number,
  lat: number,
  zone?: number,
): [number, number] => {
  const finalZone = zone && !isNaN(zone) ? zone : getUTMZoneFromLongitude(lon);
  const utmProj = `+proj=utm +zone=${finalZone} +datum=WGS84 +units=m +no_defs`;
  return proj4("EPSG:4326", utmProj, [lon, lat]);
};

const getUTMZoneFromLongitude = (lon: number): number => {
  return Math.floor((lon + 180) / 6) + 1;
};
