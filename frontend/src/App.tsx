import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotificationContainer from './components/ui/NotificationContainer'
import LoadingOverlay from './components/ui/LoadingOverlay'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingComponents'

const HomePage = lazy(() => import('./pages/HomePage'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const WritingEditorPage = lazy(() => import('./pages/WritingEditorPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ApiTestPage = lazy(() => import('./pages/ApiTestPage'))
const ScrapsPage = lazy(() => import('./pages/ScrapsPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const WorkDetailPage = lazy(() => import('./pages/WorkDetailPage'))
const ShelfPage = lazy(() => import('./pages/ShelfPage'))
const ReferencesPage = lazy(() => import('./pages/creative/ReferencesPage'))
const AiSearchPage = lazy(() => import('./pages/creative/AiSearchPage'))
const ChatPage = lazy(() => import('./pages/creative/ChatPage'))
const ProposalsPage = lazy(() => import('./pages/creative/ProposalsPage'))
const ProposalDetailPage = lazy(() => import('./pages/creative/ProposalDetailPage'))
const ProposalReviewPage = lazy(() => import('./pages/planning/ProposalReviewPage'))
const ProposalEvalPage = lazy(() => import('./pages/planning/ProposalEvalPage'))
const MetadataListPage = lazy(() => import('./pages/planning/MetadataListPage'))
const MetadataProjectPage = lazy(() => import('./pages/planning/MetadataProjectPage'))
const EvaluationPage = lazy(() => import('./pages/planning/EvaluationPage'))
const WritingProjectsPage = lazy(() => import('./pages/writing/WritingProjectsPage'))
const WritingProjectPage = lazy(() => import('./pages/writing/WritingProjectPage'))

import { PageWrapper as UI_PageWrapper } from './components/layout/PageWrapper'

const EditorWritingRedirect: React.FC = () => {
  const { projectId, chapterId } = useParams()
  if (chapterId) return <Navigate to={`/writing/${projectId}/${chapterId}`} replace />
  if (projectId) return <Navigate to={`/writing/${projectId}`} replace />
  return <Navigate to="/writing/projects" replace />
}

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    <UI_PageWrapper>{children}</UI_PageWrapper>
  </Suspense>
)

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
    path: '/shelf',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ShelfPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/work/:id',
    element: (
      <Layout>
        <SuspenseWrapper>
          <WorkDetailPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/library',
    element: <Navigate to="/collections" replace />,
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
    path: '/planning/proposals/:id',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ProposalEvalPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/planning/metadata',
    element: (
      <Layout>
        <SuspenseWrapper>
          <MetadataListPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/planning/metadata/:projectId',
    element: (
      <Layout>
        <SuspenseWrapper>
          <MetadataProjectPage />
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
  {
    path: '/writing/projects',
    element: (
      <Layout>
        <SuspenseWrapper>
          <WritingProjectsPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/writing/:projectId/:chapterId',
    element: (
      <Layout>
        <SuspenseWrapper>
          <WritingEditorPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/writing/:projectId',
    element: (
      <Layout>
        <SuspenseWrapper>
          <WritingProjectPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/projects',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/projects/:id',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/editor/:projectId/:chapterId',
    element: <EditorWritingRedirect />,
  },
  {
    path: '/editor/:projectId',
    element: <EditorWritingRedirect />,
  },
  {
    path: '/editor',
    element: <Navigate to="/writing/projects" replace />,
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
  {
    path: '/creative/proposals/:id',
    element: (
      <Layout>
        <SuspenseWrapper>
          <ProposalDetailPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/scraps',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/files',
    element: <Navigate to="/" replace />,
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
