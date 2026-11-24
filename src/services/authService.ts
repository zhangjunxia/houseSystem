import { request } from '@/utils/request'
import type { LoginResult } from '@/types'

export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>({
    method: 'post',
    url: '/login',
    data: { username, password },
  })
}