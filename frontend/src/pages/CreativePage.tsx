import { Outlet, useLocation, Navigate } from 'react-router-dom'

export default function CreativePage() {
  const location = useLocation()

  if (location.pathname === '/creative' || location.pathname === '/creative/') {
    return <Navigate to="/creative/chat" replace />
  }

  return <Outlet />
}
