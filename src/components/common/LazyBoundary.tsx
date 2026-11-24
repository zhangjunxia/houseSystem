import { Spin } from 'antd'
import type { ReactNode } from 'react'

export default function LazyBoundary({ children }: { children: ReactNode }) {
  return (
    <Spin
      spinning
      tip="加载中..."
      size="large"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}
    >
      {children}
    </Spin>
  )
}