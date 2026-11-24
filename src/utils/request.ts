import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types'

/** localStorage 键名 */
export const STORAGE_TOKEN_KEY = 'estate_auth_token'
export const STORAGE_USER_KEY = 'estate_auth_user'

/** 从 localStorage 读取登录态 */
export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_TOKEN_KEY)
}

/** 持久化登录态（禁止存 password） */
export function persistAuth(user: unknown, token: string): void {
  const safeUser = { ...(user as Record<string, unknown>) }
  delete safeUser.password
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser))
  localStorage.setItem(STORAGE_TOKEN_KEY, token)
}

/** 清除登录态 */
export function clearAuth(): void {
  localStorage.removeItem(STORAGE_USER_KEY)
  localStorage.removeItem(STORAGE_TOKEN_KEY)
}

/** 创建 axios 实例 */
const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

/** 请求拦截：注入 Token 与权限上下文 header */
instance.interceptors.request.use((config) => {
  const token = getStoredToken()
  const user = getStoredUser<{
    permissionLevel?: string
    projectId?: string
    userId?: string
    staffId?: string
  }>()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  if (user) {
    config.headers['X-Permission-Level'] = user.permissionLevel ?? ''
    config.headers['X-Project-Id'] = user.projectId ?? ''
    config.headers['X-User-Id'] = user.userId ?? ''
    config.headers['X-Staff-Id'] = user.staffId ?? ''
  }
  return config
})

/** 响应拦截：统一解包 {code, data, message}，将解包结果放回 response.data */
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data as ApiResponse<unknown>
    if (body && typeof body.code === 'number') {
      if (body.code === 200) {
        response.data = body.data
        return response
      }
      if (body.code === 401) {
        clearAuth()
        message.error('登录已过期，请重新登录')
        if (location.pathname !== '/login') {
          location.href = '/login'
        }
        return Promise.reject(new Error(body.message || '未授权'))
      }
      if (body.code === 403) {
        message.error(body.message || '无权限执行该操作')
        return Promise.reject(new Error(body.message || '无权限'))
      }
      message.error(body.message || '业务异常')
      return Promise.reject(new Error(body.message || '业务异常'))
    }
    return response
  },
  (error) => {
    message.error('网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

/** 统一请求函数 */
export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await instance.request<unknown, AxiosResponse<T>>(config)
  return response.data
}

export default instance
