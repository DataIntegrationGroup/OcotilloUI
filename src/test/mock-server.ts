// Mock server config
export const MOCK_SERVER_CONFIG = {
  URL: 'http://127.0.0.1:4010',
  AUTH_TOKEN: 'mock-token'
}

export const checkMockServerHealth = async (): Promise<boolean> => {
  try {
    //use location endpoint to check if the server is up
    const response = await fetch(`${MOCK_SERVER_CONFIG.URL}/location`, {
      headers: {
        'Authorization': `Bearer ${MOCK_SERVER_CONFIG.AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    // Accept both 200 and 401 (auth not an issue for now)
    return response.status === 200 || response.status === 401
  } catch (error) {
    console.warn('Mock server not responding. Start it with: npm run mock:server')
    return false
  }
}