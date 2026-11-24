// ============================================================================
// 地产房源档案管理后台系统 - 统一类型定义
// 对应 spec.md 第 6 章数据约束 / design.md 2.3 数据模型
// ============================================================================

// ----------------------------------------------------------------------------
// 1. 字面量联合类型
// ----------------------------------------------------------------------------

/** 权限层级：公司级 / 项目级 / 业务员级 */
export type PermissionLevel = 'company' | 'project' | 'consultant'

/** 销售人员角色：销售主管 / 销售顾问 */
export type StaffRole = 'supervisor' | 'consultant'

/** 房源状态：待售 / 已售 / 锁定 */
export type HouseStatus = '待售' | '已售' | '锁定'

/** 朝向（9 种） */
export type Orientation =
  | '南'
  | '北'
  | '东'
  | '西'
  | '东南'
  | '西南'
  | '东北'
  | '西北'
  | '南北通透'

/** 户型 */
export type HouseLayout = '一居室' | '二居室' | '三居室' | '四居室' | '五居及以上' | '复式/别墅'

/** 配套设施 */
export type Facility = '精装' | '毛坯' | '车位' | '储藏室' | '学区' | '地铁' | '商业' | '公园'

// ----------------------------------------------------------------------------
// 2. 中文标签常量映射
// ----------------------------------------------------------------------------

export const PERMISSION_LEVEL_LABEL: Record<PermissionLevel, string> = {
  company: '公司级',
  project: '项目级',
  consultant: '业务员',
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  supervisor: '销售主管',
  consultant: '销售顾问',
}

export const HOUSE_STATUS_LABEL: Record<HouseStatus, string> = {
  待售: '待售',
  已售: '已售',
  锁定: '锁定',
}

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  南: '南',
  北: '北',
  东: '东',
  西: '西',
  东南: '东南',
  西南: '西南',
  东北: '东北',
  西北: '西北',
  南北通透: '南北通透',
}

export const HOUSE_LAYOUT_LABEL: Record<HouseLayout, string> = {
  一居室: '一居室',
  二居室: '二居室',
  三居室: '三居室',
  四居室: '四居室',
  '五居及以上': '五居及以上',
  '复式/别墅': '复式/别墅',
}

export const FACILITY_LABEL: Record<Facility, string> = {
  精装: '精装',
  毛坯: '毛坯',
  车位: '车位',
  储藏室: '储藏室',
  学区: '学区',
  地铁: '地铁',
  商业: '商业',
  公园: '公园',
}

/** 权限层级数值（用于层级比较，越大权限越高） */
export const PERMISSION_LEVEL_ORDER: Record<PermissionLevel, number> = {
  company: 3,
  project: 2,
  consultant: 1,
}

// ----------------------------------------------------------------------------
// 3. 领域对象接口
// ----------------------------------------------------------------------------

/** 菜单项 */
export interface MenuItem {
  key: string
  label: string
  path: string
  icon: string
  /** 允许访问的权限层级 */
  permissionLevels: PermissionLevel[]
}

/** 用户（登录人员） */
export interface User {
  userId: string
  username: string
  password: string
  realName: string
  permissionLevel: PermissionLevel
  /** 项目级/业务员级所属项目 ID */
  projectId?: string
  /** 业务员级对应的销售人员 ID */
  staffId?: string
  /** 登录令牌 */
  token?: string
  /** 动态菜单 */
  menus: MenuItem[]
}

/** 项目 */
export interface Project {
  projectId: string
  projectCode: string
  projectName: string
  city: string
  address: string
  createTime: string
  /** 派生：该项目主管数量 */
  supervisorCount: number
  /** 派生：该项目顾问数量 */
  consultantCount: number
  /** 派生：该项目房源数量 */
  houseCount: number
}

/** 销售人员 */
export interface Staff {
  staffId: string
  staffName: string
  phone: string
  role: StaffRole
  projectId: string
  createTime: string
  /** 派生：名下房源数量 */
  houseCount: number
}

/** 房源档案 */
export interface House {
  houseId: string
  houseCode: string
  projectId: string
  layout: HouseLayout
  area: number
  totalPrice: number
  floor: number
  orientation: Orientation
  facilities: Facility[]
  /** 负责人（绑定销售顾问 staffId） */
  ownerId: string
  status: HouseStatus
  createTime: string
  images: string[]
  remark: string
}

// ----------------------------------------------------------------------------
// 4. 通用响应与查询类型
// ----------------------------------------------------------------------------

/** 统一响应结构（对应 spec.md 7.5） */
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

/** 分页结果（对应 spec.md 5.4.1.6） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 登录结果（对应 design.md 2.2.2.1） */
export interface LoginResult {
  userId: string
  username: string
  realName: string
  permissionLevel: PermissionLevel
  projectId?: string
  staffId?: string
  token: string
  menus: MenuItem[]
}

/** 房源查询条件（对应 design.md 2.2.2.4） */
export interface HouseQuery {
  projectId?: string
  layout?: HouseLayout
  areaMin?: number
  areaMax?: number
  priceMin?: number
  priceMax?: number
  floor?: number
  orientation?: Orientation
  status?: HouseStatus
  ownerId?: string
  /** 关键字（房源编号模糊匹配） */
  keyword?: string
  page: number
  pageSize: number
}

/** 异步状态机 */
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** 批量导入结果 */
export interface ImportResult {
  successCount: number
  failDetails: Array<{ row: number; reason: string }>
}

/** 项目创建/编辑载荷 */
export interface ProjectPayload {
  projectCode: string
  projectName: string
  city: string
  address: string
}

/** 人员创建/编辑载荷 */
export interface StaffPayload {
  staffName: string
  phone: string
  role: StaffRole
  projectId: string
}

/** 房源创建/编辑载荷 */
export interface HousePayload {
  houseCode: string
  projectId: string
  layout: HouseLayout
  area: number
  totalPrice: number
  floor: number
  orientation: Orientation
  facilities: Facility[]
  ownerId: string
  status: HouseStatus
  images: string[]
  remark: string
}

/** 状态修改载荷 */
export interface HouseStatusPayload {
  houseId: string
  status: HouseStatus
}
