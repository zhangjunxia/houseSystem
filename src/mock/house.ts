import Mock from 'mockjs'
import { db, genId } from './db'
import { recalcStaffHouseCount, recalcProjectStats } from './data'
import {
  getContextFromRequest,
  overrideProjectId,
  overrideOwnerId,
  canOperateHouse,
} from './permissionEngine'
import type {
  House,
  HouseQuery,
  HousePayload,
  HouseStatus,
  HouseStatusPayload,
  PageResult,
  ImportResult,
  ApiResponse,
} from '@/types'

/** 从 URL 解析查询参数 */
function parseQuery(url: string): Record<string, string> {
  const q = url.split('?')[1]
  if (!q) return {}
  const result: Record<string, string> = {}
  for (const pair of q.split('&')) {
    const [k, v] = pair.split('=')
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return result
}

/** 按 HouseQuery 过滤房源 */
function filterHouses(data: House[], query: HouseQuery): House[] {
  return data.filter((h) => {
    if (query.projectId && h.projectId !== query.projectId) return false
    if (query.layout && h.layout !== query.layout) return false
    if (query.areaMin !== undefined && h.area < query.areaMin) return false
    if (query.areaMax !== undefined && h.area > query.areaMax) return false
    if (query.priceMin !== undefined && h.totalPrice < query.priceMin) return false
    if (query.priceMax !== undefined && h.totalPrice > query.priceMax) return false
    if (query.floor !== undefined && h.floor !== query.floor) return false
    if (query.orientation && h.orientation !== query.orientation) return false
    if (query.status && h.status !== query.status) return false
    if (query.ownerId && h.ownerId !== query.ownerId) return false
    if (query.keyword) {
      const kw = query.keyword.trim().toLowerCase()
      if (kw && !h.houseCode.toLowerCase().includes(kw)) return false
    }
    return true
  })
}

/** 拦截 GET /api/house/page */
Mock.mock(/\/api\/house\/page/, 'get', (options: { url?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const params = parseQuery(options.url || '')
  const rawQuery: HouseQuery = {
    projectId: params.projectId || undefined,
    layout: (params.layout as HouseQuery['layout']) || undefined,
    areaMin: params.areaMin ? Number(params.areaMin) : undefined,
    areaMax: params.areaMax ? Number(params.areaMax) : undefined,
    priceMin: params.priceMin ? Number(params.priceMin) : undefined,
    priceMax: params.priceMax ? Number(params.priceMax) : undefined,
    floor: params.floor ? Number(params.floor) : undefined,
    orientation: (params.orientation as HouseQuery['orientation']) || undefined,
    status: (params.status as HouseStatus) || undefined,
    ownerId: params.ownerId || undefined,
    keyword: params.keyword || undefined,
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || 20,
  }
  const overriden = overrideOwnerId(ctx, overrideProjectId(ctx, rawQuery))
  const finalQuery: HouseQuery = { ...rawQuery, ...overriden }

  let scoped = db.houses
  if (ctx.permissionLevel === 'project' && ctx.projectId) {
    scoped = scoped.filter((h) => h.projectId === ctx.projectId)
  } else if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
    scoped = scoped.filter((h) => h.ownerId === ctx.staffId)
  }

  const filtered = filterHouses(scoped, finalQuery)
  const { page, pageSize } = finalQuery
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  const result: PageResult<House> = { list, total: filtered.length, page, pageSize }
  return { code: 200, data: result, message: 'success' } as ApiResponse<PageResult<House>>
})

/** 拦截 GET /api/house/detail */
Mock.mock(/\/api\/house\/detail/, 'get', (options: { url?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  const params = parseQuery(options.url || '')
  const houseId = params.houseId
  if (!houseId) {
    return { code: 500, data: null, message: '缺少房源 ID' } as ApiResponse<null>
  }
  const house = db.houses.find((h) => h.houseId === houseId)
  if (!house) {
    return { code: 500, data: null, message: '房源不存在' } as ApiResponse<null>
  }
  if (!canOperateHouse(ctx, house)) {
    return { code: 403, data: null, message: '无权限查看该房源' } as ApiResponse<null>
  }
  return { code: 200, data: house, message: 'success' } as ApiResponse<House>
})

/** 拦截 POST /api/house/create */
Mock.mock('/api/house/create', 'post', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  try {
    const body = JSON.parse(options.body || '{}') as HousePayload
    if (!body.houseCode || !body.projectId || !body.layout || !body.area || !body.totalPrice) {
      return { code: 500, data: null, message: '编号、项目、户型、面积、总价均为必填' } as ApiResponse<null>
    }
    if (db.houses.some((h) => h.houseCode === body.houseCode)) {
      return { code: 500, data: null, message: '房源编号已存在' } as ApiResponse<null>
    }
    let projectId = body.projectId
    let ownerId = body.ownerId
    if (ctx.permissionLevel === 'project' && ctx.projectId) {
      if (projectId !== ctx.projectId) {
        return { code: 403, data: null, message: '无权限操作该项目房源' } as ApiResponse<null>
      }
    }
    if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
      ownerId = ctx.staffId
    }
    const now = new Date().toISOString().slice(0, 10)
    const house: House = {
      houseId: genId('h'),
      houseCode: body.houseCode,
      projectId,
      layout: body.layout,
      area: Number(body.area),
      totalPrice: Number(body.totalPrice),
      floor: Number(body.floor),
      orientation: body.orientation,
      facilities: body.facilities || [],
      ownerId,
      status: body.status || '待售',
      createTime: now,
      images: body.images || [],
      remark: body.remark || '',
    }
    db.houses.push(house)
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: house, message: '房源创建成功' } as ApiResponse<House>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 PUT /api/house/update */
Mock.mock('/api/house/update', 'put', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  try {
    const body = JSON.parse(options.body || '{}') as House & HousePayload
    if (!body.houseId) {
      return { code: 500, data: null, message: '缺少房源 ID' } as ApiResponse<null>
    }
    const idx = db.houses.findIndex((h) => h.houseId === body.houseId)
    if (idx < 0) {
      return { code: 500, data: null, message: '房源不存在' } as ApiResponse<null>
    }
    if (!canOperateHouse(ctx, db.houses[idx])) {
      return { code: 403, data: null, message: '无权限编辑该房源' } as ApiResponse<null>
    }
    if (db.houses.some((h) => h.houseCode === body.houseCode && h.houseId !== body.houseId)) {
      return { code: 500, data: null, message: '房源编号已存在' } as ApiResponse<null>
    }
    const existing = db.houses[idx]
    db.houses[idx] = {
      ...existing,
      houseCode: body.houseCode,
      layout: body.layout,
      area: Number(body.area),
      totalPrice: Number(body.totalPrice),
      floor: Number(body.floor),
      orientation: body.orientation,
      facilities: body.facilities || [],
      remark: body.remark || '',
      images: body.images || existing.images,
    }
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: db.houses[idx], message: '房源更新成功' } as ApiResponse<House>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 PUT /api/house/status */
Mock.mock('/api/house/status', 'put', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  try {
    const body = JSON.parse(options.body || '{}') as HouseStatusPayload
    if (!body.houseId || !body.status) {
      return { code: 500, data: null, message: '缺少房源 ID 或状态' } as ApiResponse<null>
    }
    const idx = db.houses.findIndex((h) => h.houseId === body.houseId)
    if (idx < 0) {
      return { code: 500, data: null, message: '房源不存在' } as ApiResponse<null>
    }
    if (!canOperateHouse(ctx, db.houses[idx])) {
      return { code: 403, data: null, message: '无权限修改该房源状态' } as ApiResponse<null>
    }
    if (db.houses[idx].status === '锁定' && body.status === '已售') {
      return { code: 500, data: null, message: '锁定状态禁止销售操作' } as ApiResponse<null>
    }
    db.houses[idx] = { ...db.houses[idx], status: body.status }
    return { code: 200, data: db.houses[idx], message: '状态修改成功' } as ApiResponse<House>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 POST /api/house/import */
Mock.mock('/api/house/import', 'post', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  try {
    const body = JSON.parse(options.body || '{}') as { houses: HousePayload[] }
    if (!body.houses || !Array.isArray(body.houses)) {
      return { code: 500, data: null, message: '导入数据格式异常' } as ApiResponse<null>
    }
    const result: ImportResult = { successCount: 0, failDetails: [] }
    body.houses.forEach((item, i) => {
      const row = i + 2
      if (!item.houseCode || !item.projectId || !item.layout || !item.area || !item.totalPrice) {
        result.failDetails.push({ row, reason: '必填字段缺失' })
        return
      }
      if (db.houses.some((h) => h.houseCode === item.houseCode)) {
        result.failDetails.push({ row, reason: `房源编号 ${item.houseCode} 已存在` })
        return
      }
      let projectId = item.projectId
      let ownerId = item.ownerId
      if (ctx.permissionLevel === 'project' && ctx.projectId) {
        projectId = ctx.projectId
      }
      if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
        ownerId = ctx.staffId
      }
      const now = new Date().toISOString().slice(0, 10)
      db.houses.push({
        houseId: genId('h'),
        houseCode: item.houseCode,
        projectId,
        layout: item.layout,
        area: Number(item.area),
        totalPrice: Number(item.totalPrice),
        floor: Number(item.floor),
        orientation: item.orientation,
        facilities: item.facilities || [],
        ownerId: ownerId || '',
        status: item.status || '待售',
        createTime: now,
        images: item.images || [],
        remark: item.remark || '',
      })
      result.successCount++
    })
    db.staffs = recalcStaffHouseCount(db.staffs, db.houses)
    db.projects = recalcProjectStats(db.projects, db.staffs, db.houses)
    return { code: 200, data: result, message: `导入完成：成功 ${result.successCount} 条，失败 ${result.failDetails.length} 条` } as ApiResponse<ImportResult>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})

/** 拦截 POST /api/house/export（用 POST 传递查询条件） */
Mock.mock('/api/house/export', 'post', (options: { body?: string; headers?: Record<string, string> }) => {
  const ctx = getContextFromRequest(options)
  try {
    const body = JSON.parse(options.body || '{}') as HouseQuery
    const finalQuery = overrideOwnerId(ctx, overrideProjectId(ctx, body))
    let scoped = db.houses
    if (ctx.permissionLevel === 'project' && ctx.projectId) {
      scoped = scoped.filter((h) => h.projectId === ctx.projectId)
    } else if (ctx.permissionLevel === 'consultant' && ctx.staffId) {
      scoped = scoped.filter((h) => h.ownerId === ctx.staffId)
    }
    const filtered = filterHouses(scoped, { ...finalQuery, page: 1, pageSize: 100000 })
    return { code: 200, data: filtered, message: 'success' } as ApiResponse<House[]>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})