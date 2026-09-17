import { Alert, Chip, Stack } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useList, useOne } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { captureEvent } from '@/analytics/posthog'
import { InteractiveSatelliteMapCard } from '@/components'
import {
  OcotilloPageTitle,
  ocotilloCardHeaderProps,
} from '@/components/OcotilloPageHeader'
import { ProjectDetailsCard, ProjectWellsCard } from '@/components/ProjectShow'
import type { IWell } from '@/interfaces/ocotillo'
import type { IGroup } from '@/interfaces/ocotillo/IGroup'

const MAP_WELL_PAGE_SIZE = 500

export const ProjectShow = () => {
  const { id } = useParams<{ id: string }>()

  const { query: projectQuery, result: project } = useOne<IGroup>({
    resource: 'group',
    dataProviderName: 'ocotillo',
    id: id ?? '',
    queryOptions: {
      enabled: Boolean(id),
    },
  })

  const wellPageSize = useMemo(() => {
    const count = project?.well_count ?? MAP_WELL_PAGE_SIZE
    return Math.min(Math.max(count, 1), MAP_WELL_PAGE_SIZE)
  }, [project?.well_count])

  const { query: wellsQuery, result: wellsResult } = useList<IWell>({
    resource: 'thing/water-well',
    dataProviderName: 'ocotillo',
    filters: id ? [{ field: 'groups', operator: 'eq', value: id }] : [],
    pagination: { pageSize: wellPageSize },
    queryOptions: {
      enabled: Boolean(id),
    },
  })

  const wells = wellsResult?.data ?? []
  const totalWells = project?.well_count ?? wellsResult?.total ?? wells.length
  const isProjectLoading = projectQuery.isLoading
  const isWellsLoading = wellsQuery.isLoading

  useEffect(() => {
    if (!project?.id) return
    captureEvent('feature_used', {
      feature: 'project_show',
      project_id: project.id,
      project_name: project.name,
    })
  }, [project?.id, project?.name])

  return (
    <Show
      isLoading={isProjectLoading}
      goBack={false}
      breadcrumb={false}
      wrapperProps={{
        elevation: 0,
        sx: {
          bgcolor: 'background.wrapper',
          boxShadow: 'none',
          borderRadius: 1,
          padding: 0,
        },
      }}
      title={
        <OcotilloPageTitle
          title={project?.name ?? 'Project'}
          isLoading={isProjectLoading}
          loadingWidth={220}
        >
          {project?.group_type ? (
            <Chip label={project.group_type} size="small" variant="outlined" />
          ) : null}
        </OcotilloPageTitle>
      }
      headerProps={ocotilloCardHeaderProps}
      contentProps={{ sx: { pt: 1 } }}
      headerButtons={() => null}
    >
      <Stack spacing={2}>
        {projectQuery.isError ? (
          <Alert severity="error">
            Could not load this project. It may have been removed or you may not
            have access.
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Stack spacing={2}>
              <InteractiveSatelliteMapCard
                variant="project"
                wells={wells}
                projectArea={project?.project_area}
                mapTitle="Project Map"
                isLoading={isProjectLoading || isWellsLoading}
              />
              <ProjectWellsCard
                projectId={project?.id ?? id}
                projectName={project?.name}
                totalWells={totalWells}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <ProjectDetailsCard
              project={project}
              isLoading={isProjectLoading}
            />
          </Grid>
        </Grid>
      </Stack>
    </Show>
  )
}
