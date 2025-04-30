export const fetchConfig = (accessToken: string, method: string = 'GET') => {
  return {
    method: method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
}

export const lookupTableQueryConfig = {
  staleTime: 600000, // Cache for 10 minutes
  refetchOnWindowFocus: false,
}
