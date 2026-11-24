import { request } from '@/utils/request'
import type { Staff, StaffPayload, StaffRole } from '@/types'

export function fetchStaffs(): Promise<Staff[]> {
  return request<Staff[]>({ method: 'get', url: '/staff/list' })
}

export function createStaff(payload: StaffPayload): Promise<Staff> {
  return request<Staff>({ method: 'post', url: '/staff/create', data: payload })
}

export function updateStaff(staffId: string, payload: StaffPayload): Promise<Staff> {
  return request<Staff>({
    method: 'put',
    url: '/staff/update',
    data: { staffId, ...payload },
  })
}

export function deleteStaff(staffId: string): Promise<null> {
  return request<null>({ method: 'delete', url: '/staff/delete', data: { staffId } })
}

export function switchRole(staffId: string, role: StaffRole): Promise<Staff> {
  return request<Staff>({
    method: 'put',
    url: '/staff/switchRole',
    data: { staffId, role },
  })
}