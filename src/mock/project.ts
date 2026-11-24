import Mock from 'mockjs'
import { db, genId } from './db'
import { recalcProjectStats } from './data'
import { getContextFromRequest, assertPermission, filterProjectsByPermission } from './permissionEngine'
import type { Project, ProjectPayload, ApiResponse } from '@/types'

/** 拦截 GET /api/project/list */
Mock.mock(/\/api\/project\/list/, 'get', (options: { headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const list = filterProjectsByPermission(db.projects, ctx)
  return { code: 200, data: list, message: 'success' } as ApiResponse<Project[]>
})

/** 拦截 POST /api/project/create */
Mock.mock('/api/project/create', 'post', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'company')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as ProjectPayload
    if (!body.projectCode || !body.projectName || !body.city || !body.address) {
      return { code: 500, data: null, message: '项目编码、名称、城市、地址均为必填' } as ApiResponse<null>
    }
    if (db.projects.some((p) => p.projectCode === body.projectCode)) {
      return { code: 500, data: null, message: '项目编码已存在' } as ApiResponse<null>
    }
    const now = new Date().toISOString().slice(0, 10)
    const project: Project = {
      projectId: genId('p'),
      projectCode: body.projectCode,
      projectName: body.projectName,
      city: body.city,
      address: body.address,
      createTime: now,
      supervisorCount: 0,
      consultantCount: 0,
      houseCount: 0,
    }
    db.projects.push(project)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: project, message: '项目创建成功' } as ApiResponse<Project>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 PUT /api/project/update */
Mock.mock('/api/project/update', 'put', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'company')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as Project & ProjectPayload
    if (!body.projectId) {
      return { code: 500, data: null, message: '缺少项目 ID' } as ApiResponse<null>
    }
    const idx = db.projects.findIndex((p) => p.projectId === body.projectId)
    if (idx < 0) {
      return { code: 500, data: null, message: '项目不存在' } as ApiResponse<null>
    }
    if (db.projects.some((p) => p.projectCode === body.projectCode && p.projectId !== body.projectId)) {
      return { code: 500, data: null, message: '项目编码已存在' } as ApiResponse<null>
    }
    db.projects[idx] = {
      ...db.projects[idx],
      projectCode: body.projectCode,
      projectName: body.projectName,
      city: body.city,
      address: body.address,
    }
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: db.projects[idx], message: '项目更新成功' } as ApiResponse<Project>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 DELETE /api/project/delete */
Mock.mock('/api/project/delete', 'delete', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'company')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as { projectId?: string }
    if (!body.projectId) {
      return { code: 500, data: null, message: '缺少项目 ID' } as ApiResponse<null>
    }
    const hasStaff = db.staffs.some((s) => s.projectId === body.projectId)
    const hasHouse = db.houses.some((h) => h.projectId === body.projectId)
    if (hasStaff || hasHouse) {
      return { code: 500, data: null, message: '该项目下存在房源/人员，请先清理' } as ApiResponse<null>
    }
    db.projects = db.projects.filter((p) => p.projectId !== body.projectId)
    return { code: 200, data: null, message: '项目删除成功' } as ApiResponse<null>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})