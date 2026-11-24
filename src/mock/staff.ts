import Mock from 'mockjs'
import { db, genId } from './db'
import { recalcStaffHouseCount, recalcProjectStats } from './data'
import {
  getContextFromRequest,
  assertPermission,
  filterStaffsByPermission,
  canOperateStaff,
} from './permissionEngine'
import type { Staff, StaffPayload, ApiResponse } from '@/types'

/** 拦截 GET /api/staff/list */
Mock.mock(/\/api\/staff\/list/, 'get', (options: { headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  if (ctx.permissionLevel === 'consultant') {
    return { code: 403, data: null, message: '无权限查看人员列表' } as ApiResponse<null>
  }
  const list = filterStaffsByPermission(db.staffs, ctx)
  return { code: 200, data: list, message: 'success' } as ApiResponse<Staff[]>
})

/** 拦截 POST /api/staff/create */
Mock.mock('/api/staff/create', 'post', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'project')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as StaffPayload
    if (!body.staffName || !body.phone || !body.projectId) {
      return { code: 500, data: null, message: '姓名、电话、所属项目均为必填' } as ApiResponse<null>
    }
    let projectId = body.projectId
    let role = body.role
    if (ctx.permissionLevel === 'project') {
      if (ctx.projectId && projectId !== ctx.projectId) {
        return { code: 403, data: null, message: '无权限操作该项目人员' } as ApiResponse<null>
      }
      projectId = ctx.projectId!
      role = 'consultant'
    }
    const now = new Date().toISOString().slice(0, 10)
    const staff: Staff = {
      staffId: genId('s'),
      staffName: body.staffName,
      phone: body.phone,
      role,
      projectId,
      createTime: now,
      houseCount: 0,
    }
    db.staffs.push(staff)
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: staff, message: '人员新增成功' } as ApiResponse<Staff>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 PUT /api/staff/update */
Mock.mock('/api/staff/update', 'put', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'project')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as Staff & StaffPayload
    if (!body.staffId) {
      return { code: 500, data: null, message: '缺少人员 ID' } as ApiResponse<null>
    }
    const idx = db.staffs.findIndex((s) => s.staffId === body.staffId)
    if (idx < 0) {
      return { code: 500, data: null, message: '人员不存在' } as ApiResponse<null>
    }
    const target = db.staffs[idx]
    if (!canOperateStaff(ctx, target)) {
      return { code: 403, data: null, message: '无权限操作该项目人员' } as ApiResponse<null>
    }
    if (ctx.permissionLevel === 'project' && body.projectId !== ctx.projectId) {
      return { code: 403, data: null, message: '禁止跨项目绑定人员' } as ApiResponse<null>
    }
    db.staffs[idx] = {
      ...target,
      staffName: body.staffName,
      phone: body.phone,
      role: ctx.permissionLevel === 'company' ? body.role : target.role,
      projectId: ctx.permissionLevel === 'company' ? body.projectId : target.projectId,
    }
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: db.staffs[idx], message: '人员更新成功' } as ApiResponse<Staff>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 DELETE /api/staff/delete */
Mock.mock('/api/staff/delete', 'delete', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'project')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as { staffId?: string }
    if (!body.staffId) {
      return { code: 500, data: null, message: '缺少人员 ID' } as ApiResponse<null>
    }
    const target = db.staffs.find((s) => s.staffId === body.staffId)
    if (!target) {
      return { code: 500, data: null, message: '人员不存在' } as ApiResponse<null>
    }
    if (!canOperateStaff(ctx, target)) {
      return { code: 403, data: null, message: '无权限操作该项目人员' } as ApiResponse<null>
    }
    const hasHouse = db.houses.some((h) => h.ownerId === body.staffId)
    if (hasHouse) {
      return { code: 500, data: null, message: '该人员名下仍有房源，请先转移' } as ApiResponse<null>
    }
    db.staffs = db.staffs.filter((s) => s.staffId !== body.staffId)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: null, message: '人员删除成功' } as ApiResponse<null>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 PUT /api/staff/switchRole */
Mock.mock('/api/staff/switchRole', 'put', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const deny = assertPermission(ctx, 'project')
  if (deny) return { code: 403, data: null, message: deny } as ApiResponse<null>

  try {
    const body = JSON.parse(options.body || '{}') as { staffId?: string; role?: Staff['role'] }
    if (!body.staffId || !body.role) {
      return { code: 500, data: null, message: '缺少人员 ID 或角色' } as ApiResponse<null>
    }
    const idx = db.staffs.findIndex((s) => s.staffId === body.staffId)
    if (idx < 0) {
      return { code: 500, data: null, message: '人员不存在' } as ApiResponse<null>
    }
    if (!canOperateStaff(ctx, db.staffs[idx])) {
      return { code: 403, data: null, message: '无权限操作该项目人员' } as ApiResponse<null>
    }
    db.staffs[idx] = { ...db.staffs[idx], role: body.role }
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: db.staffs[idx], message: '角色切换成功' } as ApiResponse<Staff>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})