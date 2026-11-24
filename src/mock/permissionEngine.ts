import type { PermissionLevel, House, Staff, Project } from '@/types'

// ----------------------------------------------------------------------------
// 权限上下文
// ----------------------------------------------------------------------------

export interface PermissionContext {
  permissionLevel: PermissionLevel
  projectId?: string
  userId?: string
  staffId?: string
}

/** 从请求头解析权限上下文 */
export function getContextFromRequest(req: { headers?: Record<string, string> }): PermissionContext {
  const headers = req.headers || {}
  return {
    permissionLevel: (headers['x-permission-level'] || headers['X-Permission-Level'] || 'company') as PermissionLevel,
    projectId: headers['x-project-id'] || headers['X-Project-Id'] || undefined,
    userId: headers['x-user-id'] || headers['X-User-Id'] || undefined,
    staffId: headers['x-staff-id'] || headers['X-Staff-Id'] || undefined,
  }
}

// ----------------------------------------------------------------------------
// 越权校验
// ----------------------------------------------------------------------------

/** 校验是否满足所需层级，不满足返回错误消息，满足返回 null */
export function assertPermission(ctx: PermissionContext, requiredLevel: PermissionLevel): string | null {
  const order: Record<PermissionLevel, number> = { company: 3, project: 2, consultant: 1 }
  if (order[ctx.permissionLevel] < order[requiredLevel]) {
    return '无权限执行该操作'
  }
  return null
}

// ----------------------------------------------------------------------------
// 数据隔离过滤
// ----------------------------------------------------------------------------

/** 项目数据隔离 */
export function filterProjectsByPermission(data: Project[], ctx: PermissionContext): Project[] {
  if (ctx.permissionLevel === 'company') return data
  if (ctx.permissionLevel === 'project') return data.filter((p) => p.projectId === ctx.projectId)
  return []
}

/** 人员数据隔离 */
export function filterStaffsByPermission(data: Staff[], ctx: PermissionContext): Staff[] {
  if (ctx.permissionLevel === 'company') return data
  if (ctx.permissionLevel === 'project') return data.filter((s) => s.projectId === ctx.projectId)
  return []
}

/** 房源数据隔离 */
export function filterHousesByPermission(data: House[], ctx: PermissionContext): House[] {
  if (ctx.permissionLevel === 'company') return data
  if (ctx.permissionLevel === 'project') return data.filter((h) => h.projectId === ctx.projectId)
  if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
    return data.filter((h) => h.ownerId === ctx.staffId)
  }
  return []
}

// ----------------------------------------------------------------------------
// 跨项目强制覆盖
// ----------------------------------------------------------------------------

/** 项目层级强制将 query.projectId 设为本人项目（spec.md 5.4.3.2） */
export function overrideProjectId<T>(ctx: PermissionContext, query: T): T {
  if (ctx.permissionLevel === 'project' && ctx.projectId) {
    return { ...query, projectId: ctx.projectId } as T
  }
  return query
}

/** 业务员层级强制将 ownerId 设为本人 staffId */
export function overrideOwnerId<T>(ctx: PermissionContext, query: T): T {
  if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
    return { ...query, ownerId: ctx.staffId } as T
  }
  return query
}

// ----------------------------------------------------------------------------
// 操作权限校验
// ----------------------------------------------------------------------------

/** 校验是否可操作指定项目 */
export function canOperateProject(ctx: PermissionContext, projectId: string): boolean {
  if (ctx.permissionLevel === 'company') return true
  if (ctx.permissionLevel === 'project') return ctx.projectId === projectId
  return false
}

/** 校验是否可操作指定人员 */
export function canOperateStaff(ctx: PermissionContext, staff: Staff): boolean {
  if (ctx.permissionLevel === 'company') return true
  if (ctx.permissionLevel === 'project') return staff.projectId === ctx.projectId
  return false
}

/** 校验是否可操作指定房源 */
export function canOperateHouse(ctx: PermissionContext, house: House): boolean {
  if (ctx.permissionLevel === 'company') return true
  if (ctx.permissionLevel === 'project') return house.projectId === ctx.projectId
  if (ctx.permissionLevel === 'consultant') return house.ownerId === ctx.staffId
  return false
}