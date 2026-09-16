/**
 * Projects list. Unlike the other Ocotillo lists this page uses the shadcn
 * table rather than ListPage/MUI DataGrid: the group endpoint is small enough
 * to load in full, which lets sorting and filtering cover every project instead
 * of one server page.
 */

import { Typography } from '@mui/material'
import { CanAccess, useList } from '@refinedev/core'
import { PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { captureEvent } from '@/analytics/posthog'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { EditPanelLayout } from '@/components/editing'
import { ocotilloPageTitleTypographySx } from '@/components/OcotilloPageHeader'
import { CreateProjectDialog } from '@/components/ProjectEdit/CreateProjectDialog'
import { ProjectEditPanel } from '@/components/ProjectEdit/ProjectEditPanel'
import { ProjectBoundaryDialog } from '@/components/ProjectsTable/ProjectBoundaryDialog'
import { ProjectsTable } from '@/components/ProjectsTable/ProjectsTable'
import { Button } from '@/components/ui/button'
import { useAccessCapabilities } from '@/hooks'
import { IGroup } from '@/interfaces/ocotillo/IGroup'

/** The group endpoint holds low hundreds of rows; fetch them all and page locally. */
const ALL_PROJECTS_PAGE_SIZE = 500

const projectHref = (project: IGroup) => `/ocotillo/projects/show/${project.id}`

export const ProjectList: React.FC = () => {
  const { canEditAmp, canManageAmp } = useAccessCapabilities()
  const [selectedProject, setSelectedProject] = useState<IGroup | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [boundaryProject, setBoundaryProject] = useState<IGroup | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    captureEvent('feature_used', { feature: 'projects_list' })
  }, [])

  const { result, query } = useList<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    pagination: { pageSize: ALL_PROJECTS_PAGE_SIZE },
  })

  const projects = result?.data ?? []

  const openProjectPanel = useCallback(
    (project: IGroup, trigger: 'row_double_click' | 'edit_action') => {
      if (!canEditAmp) return

      setSelectedProject(project)
      setIsPanelOpen(true)
      captureEvent('projects_edit_opened', {
        project_id: project.id,
        project_name: project.name,
        trigger,
      })
    },
    [canEditAmp]
  )

  const handleSelect = useCallback((project: IGroup) => {
    setSelectedProject(project)
    captureEvent('projects_row_clicked', {
      project_id: project.id,
      project_name: project.name,
    })
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  const handleViewBoundary = useCallback((project: IGroup) => {
    setBoundaryProject(project)
    captureEvent('project_boundary_viewed', {
      project_id: project.id,
      project_name: project.name,
    })
  }, [])

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true)
    captureEvent('projects_create_opened')
  }, [])

  const handleCreated = useCallback((project: IGroup) => {
    setSelectedProject(project)
  }, [])

  return (
    <CanAccess resource="ocotillo.projects" action="list">
      <EditPanelLayout
        open={isPanelOpen && Boolean(selectedProject)}
        pinPanel="sticky"
        panel={
          selectedProject ? (
            <ProjectEditPanel
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              onClose={handleClosePanel}
            />
          ) : null
        }
      >
        {/* pt-3 aligns the title with the MUI List header other Ocotillo list pages use. */}
        <div className="flex flex-col gap-4 px-4 pb-4 pt-3 sm:px-6">
          <AppBreadcrumb />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Typography
              variant="h3"
              fontWeight={700}
              sx={ocotilloPageTitleTypographySx}
            >
              Projects
            </Typography>
            {canManageAmp ? (
              <Button size="sm" onClick={handleOpenCreate}>
                <PlusIcon className="size-4" aria-hidden />
                New project
              </Button>
            ) : null}
          </div>

          <ProjectsTable
            projects={projects}
            isLoading={query.isLoading}
            canEdit={canEditAmp}
            selectedProjectId={selectedProject?.id ?? null}
            projectHref={projectHref}
            onSelect={handleSelect}
            onEdit={openProjectPanel}
            onViewBoundary={handleViewBoundary}
          />
        </div>
      </EditPanelLayout>

      <ProjectBoundaryDialog
        project={boundaryProject}
        onClose={() => setBoundaryProject(null)}
      />

      {canManageAmp ? (
        <CreateProjectDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={handleCreated}
        />
      ) : null}
    </CanAccess>
  )
}
