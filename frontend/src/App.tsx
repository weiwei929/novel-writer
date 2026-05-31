import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
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
const ScrapsPage = lazy(() => import('./pages/ScrapsPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const ReferencesPage = lazy(() => import('./pages/creative/ReferencesPage'))
const AiSearchPage = lazy(() => import('./pages/creative/AiSearchPage'))
const ChatPage = lazy(() => import('./pages/creative/ChatPage'))
const ProposalsPage = lazy(() => import('./pages/creative/ProposalsPage'))
const ProposalReviewPage = lazy(() => import('./pages/planning/ProposalReviewPage'))
const MetadataPage = lazy(() => import('./pages/planning/MetadataPage'))
const EvaluationPage = lazy(() => import('./pages/planning/EvaluationPage'))

import { PageWrapper as UI_PageWrapper } from './components/layout/PageWrapper'

// 编辑器回退：无章节时重定向到作品详情页
const EditorFallback: React.FC = () => {
  const { projectId } = useParams()
  return <Navigate to={`/projects/${projectId}`} replace />
}

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

// 路由配置（模块级单例，避免每次渲染重新创建）
const router = createBrowserRouter([
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
    path: '/planning/proposals',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ProposalReviewPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/planning/metadata',
    element: (
      <Layout>
        <SuspenseWrapper>
          <MetadataPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/planning/evaluation',
    element: (
      <Layout>
        <SuspenseWrapper>
          <EvaluationPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/planning/projects',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ProjectsPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  // 旧路径重定向到 /planning 前缀（保留历史链接可用）
  {
    path: '/projects',
    element: <Navigate to="/planning/projects" replace />,
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
    path: '/editor/:projectId',
    element: <EditorFallback />,
  },
  {
    path: '/editor',
    element: <Navigate to="/projects" replace />,
  },
  {
    path: '/creative/references',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ReferencesPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/creative/scraps',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ScrapsPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/creative/ai-search',
    element: (
      <Layout>
        <SuspenseWrapper>
          <AiSearchPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/creative/chat',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ChatPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/creative/proposals',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ProposalsPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  // 旧路径重定向到 /creative 前缀（保留历史链接可用）
  {
    path: '/scraps',
    element: <Navigate to="/creative/scraps" replace />,
  },
  {
    path: '/files',
    element: <Navigate to="/creative/references" replace />,
  },
  {
    path: '/review',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ReviewPage />
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
    path: '/api-test',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ApiTestPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <RouterProvider router={router} />
        <NotificationContainer />
        <LoadingOverlay />
      </AuthGuard>
    </ErrorBoundary>
  )
}
