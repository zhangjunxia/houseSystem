> 文档版本：v1.0 ｜ 技术栈：React 18 + Redux Toolkit + React Router 6 + MockJS + Ant Design 5 + TypeScript（严格模式）

---

# 一、需求与存量功能关系分析

## 1.1 需求功能与存量功能对比

现有代码库为一个基于  React 18 + TypeScript + Ant Design 5 + React Router 6 的房源档案管理后台骨架，状态管理使用 zustand，Mock 数据以静态 TS 模块直接导入方式提供

### 1.1.1 已实现功能

| 需求功能 | 存量功能 | 代码位置 |  
|---------|---------|---------|
| 登录身份校验（账号密码） | 基于 mockUsers 数组的本地比对登录 | src/store/useAuthStore.ts:16-23 | 
| 登录态持久化（localStorage） | zustand persist 中间件持久化 user | src/store/useAuthStore.ts:12-27 | 
| 未登录路由拦截 | RequireAuth 组件守卫，未登录跳 /login | src/App.tsx:13-17 | 
| 动态菜单按角色渲染 | getMenusByRole 按 Role 过滤菜单 | src/utils/permission.ts:11-21 | 
| 布局框架（侧边栏+顶栏+内容区） | BasicLayout 含 Sider/Header/Content | src/layouts/BasicLayout.tsx:28-126 | 
| 房源列表基础展示 | HouseList 页面（基于 useDataStore 全量渲染） | src/pages/house/HouseList.tsx | 
| 房源详情查看 | HouseDetail 页面 | src/pages/house/HouseDetail.tsx |
| 房源新增/编辑表单 | HouseForm 页面 | src/pages/house/HouseForm.tsx | 
| 项目列表展示 | ProjectList 页面 | src/pages/project/ProjectList.tsx | 
| 人员列表展示 | StaffList 页面 | src/pages/staff/StaffList.tsx | 
| 房源编辑/删除按钮级权限 | canEditHouse / canDeleteHouse | src/utils/housePermission.ts:3-13 |
| 房源状态标签组件 | HouseStatusTag | src/components/HouseStatusTag.tsx | 
| TypeScript 类型定义（User/Project/Staff/House） | types/index.ts 已定义四类接口 | src/types/index.ts:9-106 |
| React 18 + 函数组件 + Hooks | 全量函数组件 + Hooks | src/main.tsx、src/App.tsx |
| Ant Design 5 UI 基础 | antd ^5.21 + ConfigProvider 中文化 | src/main.tsx:9-24 |
| React Router 6 路由 | BrowserRouter + Routes 嵌套 | src/App.tsx:19-43 |


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
