import Mock from 'mockjs'
import { db, genToken } from './db'
import { getMenusByPermission } from './data'
import type { LoginResult, ApiResponse } from '@/types'

/** 拦截 POST /api/login */
Mock.mock('/api/login', 'post', (options: { body?: string }) => {
  try {
    const body = JSON.parse(options.body || '{}') as { username?: string; password?: string }
    const user = db.users.find((u) => u.username === body.username && u.password === body.password)
    if (!user) {
      return { code: 500, data: null, message: '账号或密码错误' } as ApiResponse<null>
    }
    const token = genToken()
    const menus = getMenusByPermission(user.permissionLevel)
    const result: LoginResult = {
      userId: user.userId,
      username: user.username,
      realName: user.realName,
      permissionLevel: user.permissionLevel,
      projectId: user.projectId,
      staffId: user.staffId,
      token,
      menus,
    }
    return { code: 200, data: result, message: '登录成功' } as ApiResponse<LoginResult>
  } catch {
    return { code: 500, data: null, message: '请求参数异常' } as ApiResponse<null>
  }
})