import { initialProjects, initialStaffs, mockHouses, mockUsers } from './data'
import type { User, Project, Staff, House } from '@/types'

// ----------------------------------------------------------------------------
// Mock 可变数据库（运行时 CRUD 操作在此进行）
// ----------------------------------------------------------------------------

class MockDB {
  users: User[]
  projects: Project[]
  staffs: Staff[]
  houses: House[]

  constructor() {
    this.users = [...mockUsers]
    this.projects = [...initialProjects]
    this.staffs = [...initialStaffs]
    this.houses = [...mockHouses]
  }

  reset(): void {
    this.users = [...mockUsers]
    this.projects = [...initialProjects]
    this.staffs = [...initialStaffs]
    this.houses = [...mockHouses]
  }
}

export const db = new MockDB()

// ----------------------------------------------------------------------------
// ID 生成工具
// ----------------------------------------------------------------------------

export function genId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`
}

export function genToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).slice(2)}`
}