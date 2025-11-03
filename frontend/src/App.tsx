import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CollectionsPage from './pages/CollectionsPage'
import ProjectsPage from './pages/ProjectsPage'
import EditorPage from './pages/EditorPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectsPage />} />
          <Route path="/editor/:projectId/:chapterId?" element={<EditorPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
