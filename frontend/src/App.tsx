import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotificationContainer from './components/ui/NotificationContainer'
import LoadingOverlay from './components/ui/LoadingOverlay'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingComponents'

const HomePage = lazy(() => import('./pages/HomePage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const WritingEditorPage = lazy(() => import('./pages/WritingEditorPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const CreativePage = lazy(() => import('./pages/CreativePage'))
const ScrapNote = lazy(() => import('./components/creative/ScrapNote'))
const ExternalRefs = lazy(() => import('./components/creative/ExternalRefs'))
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const WorkDetailPage = lazy(() => import('./pages/WorkDetailPage'))
const ShelfPage = lazy(() => import('./pages/ShelfPage'))
const AiSearchPage = lazy(() => import('./pages/creative/AiSearchPage'))
const ProposalDetailPage = lazy(() => import('./pages/creative/ProposalDetailPage'))
const CreativeDiscussion = lazy(() => import('./components/creative/CreativeDiscussion'))
const PlanningProposal = lazy(() => import('./components/creative/PlanningProposal'))
const ProposalReviewPage = lazy(() => import('./pages/planning/ProposalReviewPage'))
const ProposalEvalPage = lazy(() => import('./pages/planning/ProposalEvalPage'))
const MetadataListPage = lazy(() => import('./pages/planning/MetadataListPage'))
const MetadataProjectPage = lazy(() => import('./pages/planning/MetadataProjectPage'))
const EvaluationPage = lazy(() => import('./pages/planning/EvaluationPage'))
const PlanningProjectsPage = lazy(() => import('./pages/planning/PlanningProjectsPage'))
const WritingProjectsPage = lazy(() => import('./pages/writing/WritingProjectsPage'))
const WritingProjectPage = lazy(() => import('./pages/writing/WritingProjectPage'))

import { PageWrapper as UI_PageWrapper } from './components/layout/PageWrapper'

const ProjectWorkRedirect: React.FC = () => {
  const { id } = useParams()
  return <Navigate to={id ? `/work/${id}` : '/'} replace />
}

const EditorWritingRedirect: React.FC = () => {
  const { projectId, chapterId } = useParams()
  if (projectId && chapterId) {
    return <Navigate to={`/writing/${projectId}/${chapterId}`} replace />
  }
  if (projectId) {
    return <Navigate to={`/work/${projectId}`} replace />
  }
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
    element: <AuthGuard />,
    children: [
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
    element: (
      <Layout>
        <SuspenseWrapper>
          <LibraryPage />
        </SuspenseWrapper>
      </Layout>
    ),
  },
  {
    path: '/collections',
    element: <Navigate to="/library" replace />,
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
          <PlanningProjectsPage />
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
    element: <ProjectWorkRedirect />,
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
    element: <Navigate to="/creative/external-refs" replace />,
  },
  {
    path: '/creative',
    element: (
      <Layout>
        <SuspenseWrapper>
          <CreativePage />
        </SuspenseWrapper>
      </Layout>
    ),
    children: [
      {
        path: 'scraps',
        element: (
          <SuspenseWrapper>
            <ScrapNote />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'external-refs',
        element: (
          <SuspenseWrapper>
            <ExternalRefs />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'chat',
        element: (
          <SuspenseWrapper>
            <CreativeDiscussion />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'proposals',
        element: (
          <SuspenseWrapper>
            <PlanningProposal />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'ai-search',
        element: (
          <SuspenseWrapper>
            <AiSearchPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'proposals/:id',
        element: (
          <SuspenseWrapper>
            <ProposalDetailPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '/scraps',
    element: <Navigate to="/creative/scraps" replace />,
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
    element: <Navigate to="/" replace />,
  },
    ],
  },
])

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <NotificationContainer />
      <LoadingOverlay />
    </ErrorBoundary>
  )
}
