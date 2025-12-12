import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotificationContainer from './components/ui/NotificationContainer'
import LoadingOverlay from './components/ui/LoadingOverlay'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingComponents'

// 懒加载页面组件（代码分割）
const HomePage = lazy(() => import('./pages/HomePage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const EnhancedEditorPage = lazy(() => import('./pages/EnhancedEditorPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ApiTestPage = lazy(() => import('./pages/ApiTestPage'))
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'))

// 页面加载包装组件
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <RouterProvider
          router={createBrowserRouter([
            {
              path: '/',
              element: (
                <Layout>
                  <PageWrapper>
                    <HomePage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/collections',
              element: (
                <Layout>
                  <PageWrapper>
                    <CollectionsPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/projects',
              element: (
                <Layout>
                  <PageWrapper>
                    <ProjectsPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/projects/:id',
              element: (
                <Layout>
                  <PageWrapper>
                    <ProjectDetailPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/editor/:chapterId',
              element: (
                <Layout>
                  <PageWrapper>
                    <EnhancedEditorPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/editor',
              element: (
                <Layout>
                  <PageWrapper>
                    <EnhancedEditorPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/stats',
              element: (
                <Layout>
                  <PageWrapper>
                    <StatsPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/files',
              element: (
                <Layout>
                  <PageWrapper>
                    <FileManagerPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/settings',
              element: (
                <Layout>
                  <PageWrapper>
                    <SettingsPage />
                  </PageWrapper>
                </Layout>
              ),
            },
            {
              path: '/api-test',
              element: (
                <Layout>
                  <PageWrapper>
                    <ApiTestPage />
                  </PageWrapper>
                </Layout>
              ),
            },
          ])}
        />

        {/* 全局UI组件 */}
        <NotificationContainer />
        <LoadingOverlay />
      </AuthGuard>
    </ErrorBoundary>
  )
}

export default App
