import { lazy } from 'react'
import type { PermissionLevel } from '@/types'

export interface RouteConfig {
  path: string
  element: React.LazyExoticComponent<React.ComponentType>
  /** 所需最低权限层级 */
  requiredLevel?: PermissionLevel
}

const ProjectList = lazy(() => import('@/pages/project/ProjectList'))
const StaffList = lazy(() => import('@/pages/staff/StaffList'))
const HouseList = lazy(() => import('@/pages/house/HouseList'))
const HouseDetail = lazy(() => import('@/pages/house/HouseDetail'))
const HouseForm = lazy(() => import('@/pages/house/HouseForm'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))

/** 业务路由表（需登录后访问） */
export const businessRoutes: RouteConfig[] = [
  { path: 'project', element: ProjectList, requiredLevel: 'company' },
  { path: 'staff', element: StaffList, requiredLevel: 'project' },
  { path: 'house', element: HouseList },
  { path: 'house/detail/:id', element: HouseDetail },
  { path: 'house/create', element: HouseForm },
  { path: 'house/edit/:id', element: HouseForm },
  { path: '403', element: Forbidden },
]