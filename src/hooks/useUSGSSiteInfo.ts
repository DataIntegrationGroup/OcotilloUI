import { useQuery } from '@tanstack/react-query'

// Fetches expanded USGS site metadata for a given site number, along with the
// column labels the service documents in the response header.

export type USGSSiteRecord = Record<string, string>

export type USGSSiteInfo = {
  record: USGSSiteRecord
  /** Column name -> the label USGS documents for it, e.g. site_tp_cd -> "Site type". */
  labels: Record<string, string>
  url: string
}

// The RDB header documents every column it is about to return, one per line:
//   #  site_tp_cd      -- Site type
const LABEL_PATTERN = /^#\s+(\w+)\s+--\s+(.+?)\s*$/

const parseLabels = (text: string): Record<string, string> => {
  const labels: Record<string, string> = {}

  for (const line of text.split('\n')) {
    if (!line.startsWith('#')) continue

    const match = line.match(LABEL_PATTERN)
    if (match) {
      labels[match[1]] = match[2]
    }
  }

  return labels
}

// Parses USGS RDB (tab-delimited) site response text into record objects.
// Adapted by AI from Jacob's Data Integration Engine code.
const makeRecords = (text: string): USGSSiteRecord[] => {
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

    records.push(
      Object.fromEntries(header.map((key, index) => [key, values[index]]))
    )
  }

  return records
}

// Calls the USGS NWIS site service and returns the parsed fields for one site.
const fetchSiteInfo = async (site_no: string): Promise<USGSSiteInfo | null> => {
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
  const records = makeRecords(text)
  if (records.length === 0) return null

  return {
    record: records[0],
    labels: parseLabels(text),
    url: url.toString(),
  }
}

// React Query hook used by USGSInfoCard; skips fetch when site_no is missing or "N/A".
export const useUSGSSiteInfo = (site_no: string) => {
  const normalizedSiteNo = site_no?.trim()
  const hasValidSiteNo = Boolean(normalizedSiteNo) && normalizedSiteNo !== 'N/A'

  return useQuery({
    queryKey: ['site_no', normalizedSiteNo],
    queryFn: () => fetchSiteInfo(normalizedSiteNo),
    enabled: hasValidSiteNo,
    staleTime: 5 * 60 * 1000, // matches the other well-show queries
    gcTime: 10 * 60 * 1000,
  })
}
