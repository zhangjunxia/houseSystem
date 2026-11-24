import type { User, Project, Staff, House, HouseLayout, Orientation, Facility, HouseStatus } from '@/types'

// ----------------------------------------------------------------------------
// 菜单配置（按权限层级过滤）
// ----------------------------------------------------------------------------

import type { MenuItem } from '@/types'

export const ALL_MENUS: MenuItem[] = [
  { key: 'project', label: '项目管理', path: '/project', icon: 'ApartmentOutlined', permissionLevels: ['company'] },
  { key: 'staff', label: '人员配置', path: '/staff', icon: 'TeamOutlined', permissionLevels: ['company', 'project'] },
  { key: 'house', label: '房源档案', path: '/house', icon: 'HomeOutlined', permissionLevels: ['company', 'project', 'consultant'] },
]

/** 按权限层级计算可见菜单 */
export function getMenusByPermission(level: string): MenuItem[] {
  return ALL_MENUS.filter((m) => m.permissionLevels.includes(level as never))
}

// ----------------------------------------------------------------------------
// 用户数据（三类角色账号各 1 个）
// ----------------------------------------------------------------------------

export const mockUsers: User[] = [
  {
    userId: 'u1',
    username: 'admin',
    password: '123456',
    realName: '超级管理员',
    permissionLevel: 'company',
    menus: [],
  },
  {
    userId: 'u2',
    username: 'manager',
    password: '123456',
    realName: '王建国',
    permissionLevel: 'project',
    projectId: 'p1',
    staffId: 's1',
    menus: [],
  },
  {
    userId: 'u3',
    username: 'consultant',
    password: '123456',
    realName: '李梦琪',
    permissionLevel: 'consultant',
    projectId: 'p1',
    staffId: 's2',
    menus: [],
  },
]

// ----------------------------------------------------------------------------
// 项目数据（5 个项目）
// ----------------------------------------------------------------------------

export const mockProjects: Project[] = [
  { projectId: 'p1', projectCode: 'FCY', projectName: '翡翠花园', city: '深圳', address: '南山区科技园北路 88 号', createTime: '2025-03-12', supervisorCount: 1, consultantCount: 3, houseCount: 0 },
  { projectId: 'p2', projectCode: 'JSYH', projectName: '江山壹号', city: '广州', address: '天河区珠江新城花城大道 200 号', createTime: '2025-05-20', supervisorCount: 1, consultantCount: 2, houseCount: 0 },
  { projectId: 'p3', projectCode: 'YDZX', projectName: '云端中心', city: '上海', address: '浦东新区世纪大道 1200 号', createTime: '2025-07-01', supervisorCount: 1, consultantCount: 2, houseCount: 0 },
  { projectId: 'p4', projectCode: 'XHLY', projectName: '星湖绿苑', city: '杭州', address: '西湖区文三路 56 号', createTime: '2025-08-15', supervisorCount: 1, consultantCount: 2, houseCount: 0 },
  { projectId: 'p5', projectCode: 'JHSM', projectName: '金湖山水', city: '南京', address: '玄武区中山路 188 号', createTime: '2025-09-10', supervisorCount: 1, consultantCount: 2, houseCount: 0 },
]

// ----------------------------------------------------------------------------
// 销售人员数据（20 个：每项目 1 主管 + 2-3 顾问）
// ----------------------------------------------------------------------------

export const mockStaffs: Staff[] = [
  { staffId: 's1', staffName: '王建国', phone: '13800001001', role: 'supervisor', projectId: 'p1', createTime: '2023-02-15', houseCount: 0 },
  { staffId: 's2', staffName: '李梦琪', phone: '13800001002', role: 'consultant', projectId: 'p1', createTime: '2023-06-01', houseCount: 0 },
  { staffId: 's3', staffName: '张伟', phone: '13800001003', role: 'consultant', projectId: 'p1', createTime: '2024-01-10', houseCount: 0 },
  { staffId: 's4', staffName: '黄涛', phone: '13800001004', role: 'consultant', projectId: 'p1', createTime: '2024-07-22', houseCount: 0 },

  { staffId: 's5', staffName: '刘洋', phone: '13800001005', role: 'supervisor', projectId: 'p2', createTime: '2022-11-08', houseCount: 0 },
  { staffId: 's6', staffName: '陈静', phone: '13800001006', role: 'consultant', projectId: 'p2', createTime: '2023-09-20', houseCount: 0 },
  { staffId: 's7', staffName: '赵磊', phone: '13800001007', role: 'consultant', projectId: 'p2', createTime: '2024-03-15', houseCount: 0 },

  { staffId: 's8', staffName: '孙慧', phone: '13800001008', role: 'supervisor', projectId: 'p3', createTime: '2024-05-06', houseCount: 0 },
  { staffId: 's9', staffName: '周强', phone: '13800001009', role: 'consultant', projectId: 'p3', createTime: '2025-02-18', houseCount: 0 },
  { staffId: 's10', staffName: '吴敏', phone: '13800001010', role: 'consultant', projectId: 'p3', createTime: '2025-08-01', houseCount: 0 },

  { staffId: 's11', staffName: '郑超', phone: '13800001011', role: 'supervisor', projectId: 'p4', createTime: '2024-06-10', houseCount: 0 },
  { staffId: 's12', staffName: '冯雪', phone: '13800001012', role: 'consultant', projectId: 'p4', createTime: '2024-09-05', houseCount: 0 },
  { staffId: 's13', staffName: '蒋勇', phone: '13800001013', role: 'consultant', projectId: 'p4', createTime: '2025-01-20', houseCount: 0 },

  { staffId: 's14', staffName: '韩梅', phone: '13800001014', role: 'supervisor', projectId: 'p5', createTime: '2024-10-12', houseCount: 0 },
  { staffId: 's15', staffName: '杨光', phone: '13800001015', role: 'consultant', projectId: 'p5', createTime: '2025-03-08', houseCount: 0 },
  { staffId: 's16', staffName: '徐磊', phone: '13800001016', role: 'consultant', projectId: 'p5', createTime: '2025-05-22', houseCount: 0 },
]

// ----------------------------------------------------------------------------
// 房源数据（程序化生成 200+ 条）
// ----------------------------------------------------------------------------

const layouts: HouseLayout[] = ['一居室', '二居室', '三居室', '三居室', '四居室', '复式/别墅']
const orientations: Orientation[] = ['南', '北', '东', '西', '东南', '西南', '东北', '西北', '南北通透']
const allStatuses: HouseStatus[] = ['待售', '待售', '待售', '已售', '锁定']
const allFacilities: Facility[] = ['精装', '毛坯', '车位', '储藏室', '学区', '地铁', '商业', '公园']

interface GenSpec {
  projectId: string
  projectCode: string
  buildings: number
  units: number
  floors: number
  roomsPerFloor: number
  basePrice: number
  consultantIds: string[]
}

const specs: GenSpec[] = [
  { projectId: 'p1', projectCode: 'FCY', buildings: 4, units: 2, floors: 18, roomsPerFloor: 4, basePrice: 78000, consultantIds: ['s2', 's3', 's4'] },
  { projectId: 'p2', projectCode: 'JSYH', buildings: 3, units: 2, floors: 22, roomsPerFloor: 4, basePrice: 95000, consultantIds: ['s6', 's7'] },
  { projectId: 'p3', projectCode: 'YDZX', buildings: 2, units: 2, floors: 15, roomsPerFloor: 3, basePrice: 110000, consultantIds: ['s9', 's10'] },
  { projectId: 'p4', projectCode: 'XHLY', buildings: 3, units: 2, floors: 16, roomsPerFloor: 3, basePrice: 68000, consultantIds: ['s12', 's13'] },
  { projectId: 'p5', projectCode: 'JHSM', buildings: 2, units: 2, floors: 12, roomsPerFloor: 3, basePrice: 72000, consultantIds: ['s15', 's16'] },
]

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

function genHouses(): House[] {
  const list: House[] = []
  let seq = 1
  for (const spec of specs) {
    for (let b = 1; b <= spec.buildings; b++) {
      for (let u = 1; u <= spec.units; u++) {
        for (let f = 1; f <= spec.floors; f++) {
          for (let r = 1; r <= spec.roomsPerFloor; r++) {
            const status = pick(allStatuses, seq)
            const layout = pick(layouts, f + r)
            const orientation = pick(orientations, b + f)
            const area = Number((60 + ((seq * 7) % 120) + (layout === '复式/别墅' ? 80 : 0)).toFixed(1))
            const floorAdj = 1 + (f - 10) * 0.002
            const unitPrice = Math.round(spec.basePrice * floorAdj)
            const totalPrice = Math.round((unitPrice * area) / 10000)
            const ownerId = pick(spec.consultantIds, f + r)
            const houseCode = `${spec.projectCode}-${String(b).padStart(2, '0')}${u}-${String(f).padStart(2, '0')}${r}`
            const createTime = `2025-${String((seq % 12) + 1).padStart(2, '0')}-${String((seq % 27) + 1).padStart(2, '0')}`
            const facilities: Facility[] = [pick(allFacilities, seq), pick(allFacilities, seq + 3)]
            const images: string[] = [
              `https://picsum.photos/seed/${houseCode}-1/600/400`,
              `https://picsum.photos/seed/${houseCode}-2/600/400`,
            ]
            list.push({
              houseId: `h${seq}`,
              houseCode,
              projectId: spec.projectId,
              layout,
              area,
              totalPrice,
              floor: f,
              orientation,
              facilities,
              ownerId,
              status,
              createTime,
              images,
              remark: status === '已售' ? '已成交' : status === '锁定' ? '临时锁定' : '',
            })
            seq++
          }
        }
      }
    }
  }
  return list
}

export const mockHouses: House[] = genHouses()

// ----------------------------------------------------------------------------
// 派生统计字段更新
// ----------------------------------------------------------------------------

/** 重新计算项目的派生统计字段 */
export function recalcProjectStats(projects: Project[], staffs: Staff[], houses: House[]): Project[] {
  return projects.map((p) => ({
    ...p,
    supervisorCount: staffs.filter((s) => s.projectId === p.projectId && s.role === 'supervisor').length,
    consultantCount: staffs.filter((s) => s.projectId === p.projectId && s.role === 'consultant').length,
    houseCount: houses.filter((h) => h.projectId === p.projectId).length,
  }))
}

/** 重新计算人员的名下房源数量 */
export function recalcStaffHouseCount(staffs: Staff[], houses: House[]): Staff[] {
  return staffs.map((s) => ({
    ...s,
    houseCount: houses.filter((h) => h.ownerId === s.staffId).length,
  }))
}

// 初始化派生字段
export const initialProjects: Project[] = recalcProjectStats(mockProjects, mockStaffs, mockHouses)
export const initialStaffs: Staff[] = recalcStaffHouseCount(mockStaffs, mockHouses)