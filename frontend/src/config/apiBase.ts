/** API base URL — production uses same-origin /api/v2 via Caddy; dev may override via VITE_API_BASE_URL */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v2'
