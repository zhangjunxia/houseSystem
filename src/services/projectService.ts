import { request } from '@/utils/request'
import type { Project, ProjectPayload } from '@/types'

export function fetchProjects(): Promise<Project[]> {
  return request<Project[]>({ method: 'get', url: '/project/list' })
}

export function createProject(payload: ProjectPayload): Promise<Project> {
  return request<Project>({ method: 'post', url: '/project/create', data: payload })
}

export function updateProject(projectId: string, payload: ProjectPayload): Promise<Project> {
  return request<Project>({
    method: 'put',
    url: '/project/update',
    data: { projectId, ...payload },
  })
}

export function deleteProject(projectId: string): Promise<null> {
  return request<null>({ method: 'delete', url: '/project/delete', data: { projectId } })
}