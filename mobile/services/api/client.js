const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

async function request(path, options = {}) {
  if (!API_BASE_URL) throw new Error('EXPO_PUBLIC_API_BASE_URL is not configured')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) throw new Error(`API request failed with status ${response.status}`)
  return response.json()
}

export const api = {
  getExperiments: () => request('/experiments'),
  askAssistant: (payload) => request('/assistant', { method: 'POST', body: JSON.stringify(payload) }),
  saveExperimentState: (payload) => request('/progress', { method: 'POST', body: JSON.stringify(payload) }),
}
