import type { PermissionLevel, MenuItem } from '@/types'

/** 全量菜单配置（对齐 spec.md 5.5.1.1 权限矩阵） */
export const ALL_MENUS: MenuItem[] = [
  {
    key: 'project',
    label: '项目管理',
    path: '/project',
    icon: 'ApartmentOutlined',
    permissionLevels: ['company'],
  },
  {
    key: 'staff',
    label: '人员配置',
    path: '/staff',
    icon: 'TeamOutlined',
    permissionLevels: ['company', 'project'],
  },
  {
    key: 'house',
    label: '房源档案',
    path: '/house',
    icon: 'HomeOutlined',
    permissionLevels: ['company', 'project', 'consultant'],
  },
]

/** 按权限层级过滤可见菜单 */
export function getMenusByPermission(level: PermissionLevel): MenuItem[] {
  return ALL_MENUS.filter((m) => m.permissionLevels.includes(level))
}

/** 校验某路径是否可被某层级访问 */
export function canAccess(path: string, level: PermissionLevel): boolean {
  return ALL_MENUS.some((m) => m.path === path && m.permissionLevels.includes(level))
}

/** 按权限层级获取默认跳转页 */
export function getDefaultPath(level: PermissionLevel): string {
  if (level === 'company') return '/project'
  return '/house'
}

/** 权限层级数值（越大权限越高） */
export const PERMISSION_LEVEL_ORDER: Record<PermissionLevel, number> = {
  company: 3,
  project: 2,
  consultant: 1,
}

/** 校验当前层级是否满足所需层级 */
export function hasPermission(current: PermissionLevel, required: PermissionLevel): boolean {
  return PERMISSION_LEVEL_ORDER[current] >= PERMISSION_LEVEL_ORDER[required]
}
