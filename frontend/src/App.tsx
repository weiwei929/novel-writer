import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import ApiTestPage from './pages/ApiTestPage'
import FileManagerPage from './pages/FileManagerPage'

function App() {
  return (
    <ErrorBoundary>
      <UIProvider>
        <AuthGuard>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/collections" element={<CollectionsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectsPage />} />
                <Route path="/editor/:projectId/:chapterId?" element={<EnhancedEditorPage />} />
                <Route path="/editor" element={<EnhancedEditorPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/files" element={<FileManagerPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/api-test" element={<ApiTestPage />} />
              </Routes>
            </Layout>
            
            {/* 全局UI组件 */}
            <NotificationContainer />
            <LoadingOverlay />
          </Router>
        </AuthGuard>
      </UIProvider>
    </ErrorBoundary>
  )
}

export default App
