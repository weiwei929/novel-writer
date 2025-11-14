import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { UIProvider } from './contexts/UIContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotificationContainer from './components/ui/NotificationContainer'
import LoadingOverlay from './components/ui/LoadingOverlay'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CollectionsPage from './pages/CollectionsPage'
import ProjectsPage from './pages/ProjectsPage'
import EnhancedEditorPage from './pages/EnhancedEditorPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import ApiTestPage from './pages/ApiTestPage'
import FileManagerPage from './pages/FileManagerPage'

function App() {
  return (
    <ErrorBoundary>
      <UIProvider>
        <AuthGuard>
          <RouterProvider router={createBrowserRouter([
            {
              path: '/',
              element: <Layout><HomePage /></Layout>
            },
            {
              path: '/collections',
              element: <Layout><CollectionsPage /></Layout>
            },
            {
              path: '/projects',
              element: <Layout><ProjectsPage /></Layout>
            },
            {
              path: '/projects/:id',
              element: <Layout><ProjectDetailPage /></Layout>
            },
            {
              path: '/editor/:chapterId',
              element: <Layout><EnhancedEditorPage /></Layout>
            },
            {
              path: '/editor',
              element: <Layout><EnhancedEditorPage /></Layout>
            },
            {
              path: '/stats',
              element: <Layout><StatsPage /></Layout>
            },
            {
              path: '/files',
              element: <Layout><FileManagerPage /></Layout>
            },
            {
              path: '/settings',
              element: <Layout><SettingsPage /></Layout>
            },
            {
              path: '/api-test',
              element: <Layout><ApiTestPage /></Layout>
            }
          ])} />
          
          {/* 全局UI组件 */}
          <NotificationContainer />
          <LoadingOverlay />
        </AuthGuard>
      </UIProvider>
    </ErrorBoundary>
  )
}

export default App
