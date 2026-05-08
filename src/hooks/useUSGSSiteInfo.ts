import { useQuery } from '@tanstack/react-query'

type USGSSiteRecord = Record<string, string>

type USGSSiteInfoRow = {
  id: number
  name: string
  value: string
}

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

const toKeyValueRows = (record: USGSSiteRecord): USGSSiteInfoRow[] => {
  return Object.entries(record).map(([name, value], index) => ({
    id: index,
    name,
    value,
  }))
}

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
