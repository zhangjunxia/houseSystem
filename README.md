> 文档版本：v1.0 ｜ 技术栈：React 18 + Redux Toolkit + React Router 6 + MockJS + Ant Design 5 + TypeScript（严格模式）

---

# 一、需求与存量功能关系分析

## 1.1 需求功能与存量功能对比

现有代码库为一个基于  React 18 + TypeScript + Ant Design 5 + React Router 6 的房源档案管理后台骨架，状态管理使用 zustand，Mock 数据以静态 TS 模块直接导入方式提供，未引入 MockJS 与 Redux Toolkit。

### 1.1.1 已实现功能

| 需求功能 | 存量功能 | 代码位置 | 匹配度 |
|---------|---------|---------|--------|
| 登录身份校验（账号密码） | 基于 mockUsers 数组的本地比对登录 | src/store/useAuthStore.ts:16-23 | 75% |
| 登录态持久化（localStorage） | zustand persist 中间件持久化 user | src/store/useAuthStore.ts:12-27 | 75% |
| 未登录路由拦截 | RequireAuth 组件守卫，未登录跳 /login | src/App.tsx:13-17 | 75% |
| 动态菜单按角色渲染 | getMenusByRole 按 Role 过滤菜单 | src/utils/permission.ts:11-21 | 75% |
| 布局框架（侧边栏+顶栏+内容区） | BasicLayout 含 Sider/Header/Content | src/layouts/BasicLayout.tsx:28-126 | 75% |
| 房源列表基础展示 | HouseList 页面（基于 useDataStore 全量渲染） | src/pages/house/HouseList.tsx | 50% |
| 房源详情查看 | HouseDetail 页面 | src/pages/house/HouseDetail.tsx | 50% |
| 房源新增/编辑表单 | HouseForm 页面 | src/pages/house/HouseForm.tsx | 50% |
| 项目列表展示 | ProjectList 页面 | src/pages/project/ProjectList.tsx | 50% |
| 人员列表展示 | StaffList 页面 | src/pages/staff/StaffList.tsx | 50% |
| 房源编辑/删除按钮级权限 | canEditHouse / canDeleteHouse | src/utils/housePermission.ts:3-13 | 50% |
| 房源状态标签组件 | HouseStatusTag | src/components/HouseStatusTag.tsx | 75% |
| TypeScript 类型定义（User/Project/Staff/House） | types/index.ts 已定义四类接口 | src/types/index.ts:9-106 | 50% |
| React 18 + 函数组件 + Hooks | 全量函数组件 + Hooks | src/main.tsx、src/App.tsx | 100% |
| Ant Design 5 UI 基础 | antd ^5.21 + ConfigProvider 中文化 | src/main.tsx:9-24 | 100% |
| React Router 6 路由 | BrowserRouter + Routes 嵌套 | src/App.tsx:19-43 | 75% |

### 1.1.2 需要扩展的功能

| 需求功能 | 存量功能 | 差异说明 | 扩展方向 |
|---------|---------|---------|---------|
| 状态管理（Redux Toolkit 四 Slice 拆分） | 现用 zustand 双 Store（useAuthStore/useDataStore） | spec.md 4.4.1 明确要求 userSlice/projectSlice/staffSlice/houseSlice 独立拆分 + thunk 异步封装；zustand 无 Slice 概念、无 createAsyncThunk 等价物 | 引入 @reduxjs/toolkit + react-redux，按四领域拆分 Slice，迁移现有 zustand 状态至 Redux store；保留 zustand 临时过渡或直接替换 |
| Mock 接口服务（MockJS 拦截 XHR/fetch） | 现为静态 TS 模块直接 import（mock/users.ts 等） | spec.md 3.2/4.5.2 要求 MockJS 模拟全部接口；现有方式无请求拦截、无统一响应结构、无接口级权限校验能力 | 引入 mockjs，在 src/mock 下按模块组织拦截器（login/project/staff/house），统一返回 {code,data,message}，按权限层级返回隔离数据 |
| 统一请求拦截层 | 无独立请求封装，页面直接读写 store | spec.md 4.4.2 要求统一 Token 注入、错误码、权限上下文处理 | 新增 src/utils/request.ts 统一封装 fetch/axios，注入 Token 与权限上下文，统一解包 {code,data,message} 并按 code 路由错误 |
| 统一响应结构 {code,data,message} | 无统一响应结构 | spec.md 7.5 要求 code=200/403/500 | 由 MockJS 拦截器统一产出，请求层统一消费 |
| 接口级权限校验 | 仅按钮级与路由级，无接口级 | spec.md 5.5.1.4 要求接口校验层级与数据归属 | MockJS 拦截器内根据请求携带的权限上下文（层级+项目ID+用户ID）做数据隔离与越权拒绝（403） |
| 分页查询（默认每页 20 条 + 总数） | 现为全量内存渲染，无分页 | spec.md 5.4.1.6 要求分页查询返回总条数与当前页 | houseSlice 增加 pagination 状态，Mock /api/house/page 按页返回，公共分页组件对接 |
| 条件组合筛选（项目/户型/面积区间/总价区间/楼层/朝向/状态/负责人） | 现有筛选能力有限或不完整 | spec.md 5.4.1.5 要求多条件组合 | 抽离 SearchBar 公共组件，筛选状态入 houseSlice，Mock 拦截器按条件过滤 |
| 批量导入（Excel ≥500 条，返回成功/失败明细） | 未实现 | spec.md 5.4.1.7 / 4.1.4 | 引入 xlsx 解析，Mock /api/house/import 校验并返回明细 |
| 批量导出（当前筛选条件导出 Excel） | 未实现 | spec.md 5.4.1.8 | 引入 xlsx 生成，Mock /api/house/export 按当前筛选条件导出全字段 |
| 房源状态修改独立接口 | 现为表单整体更新 | spec.md 7.4.5 要求 PUT /api/house/status | 新增独立状态修改接口与对应 thunk |
| 人员角色切换接口 | 未实现 | spec.md 7.3.5 要求 PUT /api/staff/switchRole | 新增接口与 thunk，校验层级与项目归属 |
| 项目删除二次确认 + 关联校验 | 未实现关联校验 | spec.md 5.2.1.3 | Mock 删除接口校验房源/人员关联，前端 Modal.confirm 二次确认 |
| 人员删除关联校验（名下房源） | 未实现 | spec.md 5.3.1.3 | Mock 删除接口校验名下房源，拒绝并提示转移 |
| 公共组件抽离（SearchBar/Pagination/Table/Modal） | 仅 HouseStatusTag 一个公共组件 | spec.md 4.4.4 / 验收 7 | 新增 src/components/common 下四类公共组件，多页面复用 |
| 路由懒加载 | 现为静态 import 全量打包 | spec.md 4.1.1 / 4.5.2 | React.lazy + Suspense 按页面分包，配合 Vite 自动代码分割 |
| Token 机制 | 现无 Token，仅持久化 user | spec.md 6.1.7 / 5.1.1 | 登录返回 token，请求层注入，登出清除 |
| 跨项目访问拦截（接口强制覆盖项目ID） | 仅前端按钮级 | spec.md 5.4.3.2 | Mock 拦截器对 project 层级强制覆盖 projectId 为本人项目 |

### 1.1.3 需要新增的功能或接口

按业务模块分组，下列功能在存量代码中完全无对应实现，需新增：

**A. 基础设施层**
1. Redux Store 装配（src/store/index.ts）：combineReducers 四 Slice + 中间件（thunk）+ DevTools。
2. 统一请求封装（src/utils/request.ts）：fetch/axios 封装 + Token 注入 + 权限上下文注入 + 响应解包 + 错误码路由 + 全局 message。
3. MockJS 初始化入口（src/mock/index.ts）：聚合各模块拦截器，应用启动时安装。
4. 路由懒加载边界组件（src/components/SuspenseWrapper）。

**B. 状态管理 Slice 层**
5. userSlice：登录态、Token、权限层级、菜单列表、登出清理；loginThunk 异步调用 /api/login。
6. projectSlice：项目列表、增删改 thunk；按层级隔离查询。
7. staffSlice：人员列表、增删改、角色切换 thunk；按层级与项目隔离。
8. houseSlice：房源分页列表、总数、筛选条件、详情、状态修改、导入导出 thunk。

**C. 接口契约层（MockJS 拦截器）**
9. POST /api/login：按账号返回层级化用户上下文 + Token + menus。
10. GET /api/project/list、POST /api/project/create、PUT /api/project/update、DELETE /api/project/delete（含关联校验）。
11. GET /api/staff/list、POST /api/staff/create、PUT /api/staff/update、DELETE /api/staff/delete（含名下房源校验）、PUT /api/staff/switchRole。
12. GET /api/house/page（多条件 + 分页 + 层级隔离）、GET /api/house/detail、POST /api/house/create、PUT /api/house/update、PUT /api/house/status、POST /api/house/import、GET /api/house/export。

**D. 公共组件层**
13. SearchBar（条件组合筛选，字段可配置）。
14. ProTable（封装 antd Table + 分页 + loading + 空态）。
15. ProPagination（分页器，受控 page/pageSize/total）。
16. ProModal（弹窗，封装确认/表单/详情三种模式 + 二次确认）。
17. PermissionButton（按钮级权限包裹组件，按层级与归属判定可见/可用）。

**E. 页面与路由层**
18. 403 无权限页（src/pages/Forbidden.tsx）。
19. 路由守卫升级：RequireAuth 增加权限层级校验，越权跳 /403 或首页。
20. 动态菜单生成器升级：按 permissionLevel（company/project/consultant）生成菜单，与 spec.md 权限矩阵对齐。

**F. 数据模型层**
21. 权限层级类型 PermissionLevel = 'company' | 'project' | 'consultant'。
22. 统一响应类型 ApiResponse<T> = { code: number; data: T; message: string }。
23. 分页响应类型 PageResult<T> = { list: T[]; total: number; page: number; pageSize: number }。

## 1.2 存量功能详细分析

### 1.2.1 登录与鉴权（useAuthStore）

- **接口契约**：login(username, password) → { success: boolean; message?: string }；同步函数，直接在内存中比对 mockUsers 数组，无 Token、无接口调用、无统一响应结构。
- **业务规则**：仅校验账号密码匹配；登录成功后将 password 置空后存入 user；未区分 permissionLevel 概念，使用 role 字段（company_admin/project_manager/sales_consultant）。
- **扩展点**：zustand persist 中间件以 'house-auth' 为 key 持久化至 localStorage。

### 1.2.2 数据存储（useDataStore）

- **接口契约**：projects/staffs/houses 全量数组 + add/update/remove 同步方法；无分页、无筛选、无接口调用。
- **业务规则**：直接内存增删改，无权限隔离（任何角色调用同一份数据）；updateHouse 自动刷新 updatedAt。
- **扩展点**：无。

### 1.2.3 权限与菜单（permission.ts / housePermission.ts）

- **接口契约**：getMenusByRole(role) → MenuItem[]；canAccess(path, role) → boolean；canEditHouse/canDeleteHouse(user, house) → boolean；ROLE_LEVEL 映射 3/2/1。
- **业务规则**：菜单按 Role 数组过滤；房源编辑权限：company 全量、project 按 projectId、consultant 按 staffId；删除权限：consultant 一律 false。
- **扩展点**：菜单配置以静态数组声明，新增菜单需修改源码。

### 1.2.4 路由与布局（App.tsx / BasicLayout.tsx）

- **接口契约**：BrowserRouter + 嵌套 Routes；RequireAuth 仅校验 user 存在性；BasicLayout 含 Sider 菜单 + Header 用户区 + Content Outlet。
- **业务规则**：未登录跳 /login；菜单按 role 过滤；选中态按 pathname 一级路径匹配。
- **扩展点**：RequireAuth 可扩展为携带权限层级校验。

### 1.2.5 类型定义（types/index.ts）

- **接口契约**：User/Project/Staff/House 四接口 + 若干 Label 常量映射。
- **业务规则**：HouseStatus 含 unsold/booked/sold/locked 四态；Orientation/HouseType 为英文枚举 + 中文 Label。
