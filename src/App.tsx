import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppSelector } from '@/store/hooks'
import { hasPermission, getDefaultPath } from '@/utils/permission'
import type { PermissionLevel } from '@/types'
import BasicLayout from '@/layouts/BasicLayout'
import { businessRoutes } from '@/router/routes'

const Login = lazy(() => import('@/pages/Login'))

/** 路由守卫：校验登录态 + 权限层级 */
function RequireAuth({
  children,
  requiredLevel,
}: {
  children: React.ReactNode
  requiredLevel?: PermissionLevel
}) {
  const user = useAppSelector((s) => s.user.user)
  if (!user) return <Navigate to="/login" replace />
  if (requiredLevel && !hasPermission(user.permissionLevel, requiredLevel)) {
    return <Navigate to="/403" replace />
  }
  return <>{children}</>
}

function LazyFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <Spin size="large" tip="加载中..." />
    </div>
  )
}

export default function App() {
  const user = useAppSelector((s) => s.user.user)
  const defaultPath = user ? getDefaultPath(user.permissionLevel) : '/login'

  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <BasicLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to={defaultPath} replace />} />
          {businessRoutes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <RequireAuth requiredLevel={r.requiredLevel}>
                  <r.element />
                </RequireAuth>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </Suspense>
  )
}
