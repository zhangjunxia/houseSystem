// ============================================================================
// MockJS 聚合入口
// 通过 VITE_USE_MOCK 环境变量控制是否启用 Mock（开发环境默认开启）
// ============================================================================

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export function setupMock(): void {
  if (!useMock) return
  // 顺序导入各模块拦截器（import 即注册 Mock.mock）
  import('./login')
  import('./project')
  import('./staff')
  import('./house')
  // eslint-disable-next-line no-console
  console.log('[MockJS] 拦截器已安装')
}