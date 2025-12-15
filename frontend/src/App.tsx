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
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'))
const ApiTestPage = lazy(() => import('./pages/ApiTestPage'))

import { PageWrapper as UI_PageWrapper } from './components/layout/PageWrapper'

// 页面加载包装组件 - 处理 Suspense
const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    <UI_PageWrapper>
      {children}
    </UI_PageWrapper>
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
                  <SuspenseWrapper>
                    <HomePage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/settings',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <SettingsPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/collections',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <CollectionsPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/projects',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <ProjectsPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/projects/:id',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <ProjectDetailPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/editor/:projectId/:chapterId',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <EnhancedEditorPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/editor',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <EnhancedEditorPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/stats',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <StatsPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/files',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <FileManagerPage />
                  </SuspenseWrapper>
                </Layout>
              ),
            },
            {
              path: '/api-test',
              element: (
                <Layout>
                  <SuspenseWrapper>
                    <ApiTestPage />
                  </SuspenseWrapper>
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
