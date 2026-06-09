import { useQuery } from '@tanstack/react-query'

// Fetches expanded USGS site metadata for a given site number and exposes it as key/value rows.

type USGSSiteRecord = Record<string, string>

type USGSSiteInfoRow = {
  id: number
  name: string
  value: string
}

// Parses USGS RDB (tab-delimited) site response text into record objects.
// Adapted by AI from Jacob's Data Integration Engine code.
const makeRecords = (text: string, url: string): USGSSiteRecord[] => {
  let header: string[] = []
  const records: USGSSiteRecord[] = []

  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) {
      continue
    }

    const values = line.split('\t').map((value) => value.trim())

    if (values[0] === 'agency_cd') {
      header = values
      continue
    }

    if (values[0] === '5s') {
      continue
    }

    if (!header.length || values.length !== header.length || !values[0]) {
      continue
    }

    records.push({
      ...Object.fromEntries(header.map((key, index) => [key, values[index]])),
      url,
    })
  }

  return records
}

// Flattens a site record into DataGrid-friendly { name, value } rows.
const toKeyValueRows = (record: USGSSiteRecord): USGSSiteInfoRow[] => {
  return Object.entries(record).map(([name, value], index) => ({
    id: index,
    name,
    value,
  }))
}

// Calls the USGS NWIS site service and returns parsed site fields for one site.
const fetchSiteInfo = async (site_no: string): Promise<USGSSiteInfoRow[]> => {
  const url = new URL('https://waterservices.usgs.gov/nwis/site/')
  url.search = new URLSearchParams({
    format: 'rdb',
    siteStatus: 'all',
    siteOutput: 'expanded',
    sites: site_no,
  }).toString()

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`USGS site info request failed with status ${res.status}`)
  }

  const text = await res.text()
  const records = makeRecords(text, url.toString())

  return records.length > 0 ? toKeyValueRows(records[0]) : []
}


// React Query hook used by USGSInfoCard; skips fetch when site_no is missing or "N/A".
export const useUSGSSiteInfo = (site_no: string) => {
  const normalizedSiteNo = site_no?.trim()
  const hasValidSiteNo = Boolean(normalizedSiteNo) && normalizedSiteNo !== 'N/A'

  return useQuery({
    queryKey: ['site_no', normalizedSiteNo],
    queryFn: () => fetchSiteInfo(normalizedSiteNo),
    enabled: hasValidSiteNo,
    initialData: [],
  })
}
