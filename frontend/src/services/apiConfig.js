const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '')

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`
}
