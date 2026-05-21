# GOAL.md

# 产品需求文档：通用 RBAC 后台底座

## 0. Codex 执行原则

你是资深全栈工程师，需要在当前仓库中一次性完成一个可运行、可二开的通用 RBAC 后台底座。

不要只写示例代码，不要只写 TODO，不要只改一半。必须完成后端、前端、数据库、种子数据、权限联调、运行脚本、基础测试、README。

如果当前目录为空或不是 Vben Admin 项目：

1. 使用官方 Vben Admin 5.x 最新代码作为前端基础。
2. 使用 Ant Design Vue 版本，即 `front`。
3. 在同一个 Monorepo 下新增 `backend` 作为 NestJS 后端应用。

如果当前目录已经是 Vben Admin 项目：

1. 保留原有 Monorepo 结构。
2. 不破坏 Vben 现有工程规范。
3. 在 `backend` 新增 NestJS 后端。
4. 改造 `front`，让它连接真实后端接口，不再依赖 Mock 登录与 Mock 权限数据。

遇到需求未明确的地方，不要停下来问用户，使用本文档中的默认方案。

---

## 1. 产品定位

产品名称：RBAC Admin Starter

目标：做一个基于 NestJS + Vben Admin 的通用后台管理底座，后续任何业务项目都可以基于它二次开发。

不是 SaaS 平台第一版，不做复杂 ABAC/ReBAC，不做低代码，不做工作流。第一版重点是：

1. 登录认证。
2. 用户管理。
3. 角色管理。
4. 菜单管理。
5. 按钮权限。
6. 部门管理。
7. 接口权限。
8. 动态路由。
9. 操作日志。
10. 可二开的工程结构。

---

## 2. 技术栈

### 2.1 后端

- Node.js 20.15+
- NestJS latest stable
- TypeScript strict mode
- Prisma ORM
- PostgreSQL
- Redis 可选，第一版保留配置但不强依赖
- JWT access token + refresh token
- Passport / NestJS Guard
- class-validator / class-transformer
- Swagger / OpenAPI
- bcrypt 密码加密
- pnpm workspace

### 2.2 前端

- Vben Admin 5.x
- 使用 `front`
- Vue 3
- TypeScript
- Pinia
- Vue Router
- Ant Design Vue
- Axios 或 Vben 现有 request 封装
- 动态菜单和动态路由
- 按钮级权限指令或工具函数

### 2.3 工程

- Monorepo
- pnpm
- turbo
- Docker Compose
- ESLint / Typecheck / Build 必须通过
- README 中写清楚启动方式

---

## 3. 推荐目录结构

在 Vben Admin Monorepo 基础上增加后端：

```txt
.
├── backend                         # NestJS 后端
│   │   ├── prisma
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common
│   │   │   │   ├── decorators
│   │   │   │   ├── guards
│   │   │   │   ├── interceptors
│   │   │   │   ├── filters
│   │   │   │   ├── dto
│   │   │   │   └── utils
│   │   │   ├── config
│   │   │   ├── prisma
│   │   │   ├── auth
│   │   │   ├── users
│   │   │   ├── roles
│   │   │   ├── menus
│   │   │   ├── departments
│   │   │   ├── audit-logs
│   │   │   └── dashboard
│   │   ├── test
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
├── front                    # Vben Admin 前端
│       └── 按 Vben 现有结构改造
│
├── workspace                # Vben 共享包与工程脚本
│       ├── packages
│       ├── internal
│       └── scripts
│
├── docker-compose.yml
├── README.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## 4. 账号与权限模型

第一版采用经典 RBAC：

```txt
用户 User
  -> 用户角色 UserRole
    -> 角色 Role
      -> 角色菜单 RoleMenu
        -> 菜单/按钮 Menu
```

权限分三类：

1. 目录权限：控制左侧一级菜单。
2. 菜单权限：控制页面路由。
3. 按钮权限：控制页面按钮和后端接口。

菜单表同时承载目录、页面、按钮。

---

## 5. 数据库设计

使用 Prisma，数据库 PostgreSQL。

### 5.1 Tenant 预留

第一版不做租户管理页面，但数据库预留 `tenantId`，默认 seed 一个租户 `default`，方便未来升级 SaaS。

### 5.2 核心表

必须实现以下模型：

#### Tenant

字段：

- id
- code，唯一
- name
- status
- createdAt
- updatedAt

#### User

字段：

- id
- tenantId
- username，租户内唯一
- email，可空
- phone，可空
- passwordHash
- nickname
- avatar，可空
- status：ENABLED / DISABLED
- isSuperAdmin：boolean
- deptId，可空
- lastLoginAt，可空
- createdAt
- updatedAt
- deletedAt，可空

#### Role

字段：

- id
- tenantId
- code，租户内唯一
- name
- description，可空
- status：ENABLED / DISABLED
- sort
- isSystem
- createdAt
- updatedAt
- deletedAt，可空

#### Menu

字段：

- id
- tenantId
- parentId，可空
- type：DIRECTORY / MENU / BUTTON
- title
- name，可空，路由 name
- path，可空
- component，可空
- redirect，可空
- icon，可空
- permission，可空，例如 `system:user:create`
- sort
- hidden：boolean
- keepAlive：boolean
- externalLink，可空
- status：ENABLED / DISABLED
- createdAt
- updatedAt
- deletedAt，可空

#### Department

字段：

- id
- tenantId
- parentId，可空
- name
- code
- sort
- leader，可空
- phone，可空
- email，可空
- status：ENABLED / DISABLED
- createdAt
- updatedAt
- deletedAt，可空

#### UserRole

字段：

- userId
- roleId
- createdAt

联合唯一：

- userId + roleId

#### RoleMenu

字段：

- roleId
- menuId
- createdAt

联合唯一：

- roleId + menuId

#### AuditLog

字段：

- id
- tenantId
- actorId，可空
- actorUsername，可空
- action
- module
- method
- path
- ip，可空
- userAgent，可空
- targetType，可空
- targetId，可空
- requestBody，Json，可空
- responseStatus，可空
- durationMs，可空
- createdAt

---

## 6. 种子数据

必须提供 `prisma/seed.ts`。

### 6.1 默认租户

```txt
code: default
name: 默认租户
status: ENABLED
```

### 6.2 默认部门

```txt
总公司
├── 研发部
├── 产品部
└── 运营部
```

### 6.3 默认角色

#### super_admin

- 名称：超级管理员
- 系统角色
- 拥有全部菜单和按钮权限

#### admin

- 名称：管理员
- 拥有系统管理相关大部分权限，但不是超级管理员

#### user

- 名称：普通用户
- 只能看到首页和个人中心

### 6.4 默认用户

#### admin

```txt
username: admin
password: Admin@123456
nickname: 超级管理员
role: super_admin
isSuperAdmin: true
status: ENABLED
```

#### demo

```txt
username: demo
password: Demo@123456
nickname: 演示用户
role: user
isSuperAdmin: false
status: ENABLED
```

### 6.5 默认菜单

必须 seed 以下菜单：

```txt
Dashboard
- 首页
  permission: dashboard:overview

系统管理
- 用户管理
  permission: system:user:list
  buttons:
    system:user:create
    system:user:update
    system:user:delete
    system:user:reset-password
    system:user:assign-role

- 角色管理
  permission: system:role:list
  buttons:
    system:role:create
    system:role:update
    system:role:delete
    system:role:assign-menu

- 菜单管理
  permission: system:menu:list
  buttons:
    system:menu:create
    system:menu:update
    system:menu:delete

- 部门管理
  permission: system:department:list
  buttons:
    system:department:create
    system:department:update
    system:department:delete

系统审计
- 操作日志
  permission: system:audit:list
```

---

## 7. 后端功能需求

### 7.1 全局要求

后端所有接口统一前缀：

```txt
/api
```

返回格式统一：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

分页返回格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
}
```

错误格式：

```json
{
  "code": 40001,
  "message": "用户名或密码错误",
  "data": null
}
```

必须实现：

- 全局异常过滤器
- 全局响应拦截器
- 全局 ValidationPipe
- CORS
- Swagger 文档 `/api/docs`
- 请求日志和操作审计

### 7.2 Auth 模块

接口：

#### POST /api/auth/login

请求：

```json
{
  "username": "admin",
  "password": "Admin@123456"
}
```

响应：

```json
{
  "accessToken": "xxx",
  "refreshToken": "xxx",
  "expiresIn": 7200,
  "user": {
    "id": "xxx",
    "username": "admin",
    "nickname": "超级管理员",
    "avatar": null,
    "isSuperAdmin": true
  }
}
```

要求：

- 校验用户是否存在。
- 校验密码。
- 禁用用户不能登录。
- 登录成功更新 lastLoginAt。
- 登录成功写入审计日志。

#### POST /api/auth/refresh

请求：

```json
{
  "refreshToken": "xxx"
}
```

响应新的 accessToken。

#### POST /api/auth/logout

需要登录。第一版可以只返回成功。

#### GET /api/auth/me

返回当前用户、角色、权限码、菜单树。

响应：

```json
{
  "user": {
    "id": "xxx",
    "username": "admin",
    "nickname": "超级管理员",
    "avatar": null
  },
  "roles": ["super_admin"],
  "permissions": ["system:user:list", "system:user:create"],
  "menus": []
}
```

#### GET /api/auth/menus

返回当前用户可访问菜单树，供 Vben 动态路由使用。

### 7.3 权限 Guard

必须实现：

```ts
@RequirePermissions('system:user:create')
```

如果用户是 `isSuperAdmin = true`，直接放行。

否则：

1. 读取 JWT 用户 id。
2. 查询用户角色。
3. 查询角色菜单权限。
4. 判断是否包含权限码。
5. 无权限返回 403。

必须实现：

- JwtAuthGuard
- PermissionsGuard
- CurrentUser decorator
- RequirePermissions decorator

### 7.4 Users 模块

接口：

```txt
GET    /api/system/users
GET    /api/system/users/:id
POST   /api/system/users
PATCH  /api/system/users/:id
DELETE /api/system/users/:id
PATCH  /api/system/users/:id/status
POST   /api/system/users/:id/reset-password
POST   /api/system/users/:id/roles
```

分页查询支持：

- username
- nickname
- phone
- status
- deptId

新增用户：

- username 必填
- password 必填
- nickname 必填
- roleIds 可选
- deptId 可选

删除用户使用软删除。禁止删除自己。禁止删除超级管理员 admin。

权限码：

- list: `system:user:list`
- create: `system:user:create`
- update: `system:user:update`
- delete: `system:user:delete`
- reset password: `system:user:reset-password`
- assign role: `system:user:assign-role`

### 7.5 Roles 模块

接口：

```txt
GET    /api/system/roles
GET    /api/system/roles/:id
POST   /api/system/roles
PATCH  /api/system/roles/:id
DELETE /api/system/roles/:id
PATCH  /api/system/roles/:id/status
GET    /api/system/roles/:id/menus
POST   /api/system/roles/:id/menus
```

要求：

- code 租户内唯一。
- 系统角色不可删除。
- 角色删除前检查是否已绑定用户；已绑定则不允许删除。
- 角色授权菜单时支持目录、菜单、按钮 ID 数组。

权限码：

- `system:role:list`
- `system:role:create`
- `system:role:update`
- `system:role:delete`
- `system:role:assign-menu`

### 7.6 Menus 模块

接口：

```txt
GET    /api/system/menus
GET    /api/system/menus/tree
GET    /api/system/menus/:id
POST   /api/system/menus
PATCH  /api/system/menus/:id
DELETE /api/system/menus/:id
PATCH  /api/system/menus/:id/status
```

要求：

- 支持目录、菜单、按钮。
- 支持树形返回。
- 有子节点时不允许删除。
- 菜单 permission 可为空，但按钮 permission 必须填写。
- path、component 按 Vben 动态路由需要适配。

权限码：

- `system:menu:list`
- `system:menu:create`
- `system:menu:update`
- `system:menu:delete`

### 7.7 Departments 模块

接口：

```txt
GET    /api/system/departments
GET    /api/system/departments/tree
GET    /api/system/departments/:id
POST   /api/system/departments
PATCH  /api/system/departments/:id
DELETE /api/system/departments/:id
PATCH  /api/system/departments/:id/status
```

要求：

- 支持树形结构。
- 有子部门时不允许删除。
- 有用户绑定时不允许删除。

权限码：

- `system:department:list`
- `system:department:create`
- `system:department:update`
- `system:department:delete`

### 7.8 Audit Logs 模块

接口：

```txt
GET /api/system/audit-logs
```

支持分页与筛选：

- actorUsername
- module
- action
- method
- path
- createdAt range

权限码：

- `system:audit:list`

审计写入范围：

- 登录
- 新增/修改/删除用户
- 重置密码
- 分配角色
- 新增/修改/删除角色
- 分配菜单
- 新增/修改/删除菜单
- 新增/修改/删除部门

### 7.9 Dashboard 模块

接口：

```txt
GET /api/dashboard/overview
```

返回：

```json
{
  "userCount": 0,
  "roleCount": 0,
  "menuCount": 0,
  "departmentCount": 0,
  "recentLogs": []
}
```

权限码：

- `dashboard:overview`

---

## 8. 前端功能需求

基于 `front` 改造，不从零写普通 Vue 项目。

### 8.1 登录页

使用 Vben 现有登录页或风格一致的登录页。

要求：

- username
- password
- 登录成功保存 accessToken、refreshToken。
- 登录后调用 `/api/auth/me` 获取用户信息、权限码和菜单。
- 进入 Dashboard。
- 登录失败提示错误。

默认账号在页面下方展示：

```txt
管理员：admin / Admin@123456
演示用户：demo / Demo@123456
```

### 8.2 动态路由与菜单

使用后端 `/api/auth/menus` 返回的数据生成前端菜单和路由。

必须适配 Vben 的路由结构。

菜单类型：

- DIRECTORY：只作为目录。
- MENU：生成页面路由。
- BUTTON：不生成路由，只作为权限码。

Vben 前端需要能根据权限码控制按钮显示。

实现工具函数：

```ts
hasPermission(code: string): boolean
hasAnyPermission(codes: string[]): boolean
hasAllPermissions(codes: string[]): boolean
```

实现按钮权限用法，例如：

```vue
<a-button v-if="hasPermission('system:user:create')">新增</a-button>
```

或者使用 Vben 推荐的权限组件/指令，二者选择一种即可，但必须在页面中实际使用。

### 8.3 页面清单

必须完成以下页面：

```txt
/login
/dashboard

/system/user
/system/role
/system/menu
/system/department
/system/audit-log

/profile
```

### 8.4 Dashboard 页面

展示：

- 用户数
- 角色数
- 菜单数
- 部门数
- 最近操作日志

### 8.5 用户管理页面

功能：

- 表格分页
- 按 username、nickname、status、deptId 筛选
- 新增用户弹窗
- 编辑用户弹窗
- 删除用户
- 启用/禁用用户
- 重置密码
- 分配角色
- 部门树筛选

按钮权限：

- 新增按钮需要 `system:user:create`
- 编辑按钮需要 `system:user:update`
- 删除按钮需要 `system:user:delete`
- 重置密码按钮需要 `system:user:reset-password`
- 分配角色按钮需要 `system:user:assign-role`

### 8.6 角色管理页面

功能：

- 表格分页
- 新增角色
- 编辑角色
- 删除角色
- 启用/禁用角色
- 分配菜单权限

分配菜单权限使用树形控件：

- 展示目录、菜单、按钮。
- 支持勾选。
- 保存到 `/api/system/roles/:id/menus`。

### 8.7 菜单管理页面

功能：

- 树形表格
- 新增目录
- 新增菜单
- 新增按钮
- 编辑
- 删除
- 启用/禁用

字段：

- 类型
- 标题
- 路由 name
- path
- component
- icon
- permission
- sort
- hidden
- keepAlive
- status

### 8.8 部门管理页面

功能：

- 树形表格
- 新增部门
- 编辑部门
- 删除部门
- 启用/禁用

### 8.9 操作日志页面

功能：

- 表格分页
- 筛选 actorUsername、module、method、path、时间范围
- 查看详情弹窗，展示 requestBody

### 8.10 个人中心

功能：

- 展示当前用户信息
- 修改昵称
- 修改密码

后端需要补充接口：

```txt
PATCH /api/profile
POST  /api/profile/change-password
```

---

## 9. API 命名和前端请求

前端所有请求统一走 Vben 的 request 封装。

配置环境变量：

```txt
VITE_GLOB_API_URL=http://localhost:3000/api
```

如果 Vben 当前项目使用其他环境变量名，以当前项目约定为准，但 README 中必须写清楚。

---

## 10. 安全要求

1. 密码必须 bcrypt 加密。
2. JWT secret 从环境变量读取。
3. access token 默认 2 小时过期。
4. refresh token 默认 7 天过期。
5. 默认拒绝无权限访问。
6. 禁止前端权限替代后端权限，后端必须 Guard 校验。
7. 禁止删除当前登录用户。
8. 禁止删除系统超级管理员。
9. 禁止普通用户访问系统管理页面。
10. 后端接口不能直接返回 passwordHash。

---

## 11. 环境变量

### 后端 `backend/.env.example`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rbac_admin?schema=public"
JWT_ACCESS_SECRET="replace-me-access-secret"
JWT_REFRESH_SECRET="replace-me-refresh-secret"
JWT_ACCESS_EXPIRES_IN="2h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
CORS_ORIGIN="http://localhost:5555"
```

### 前端 `.env.development`

```env
VITE_GLOB_API_URL=http://localhost:3000/api
```

根据 Vben 实际环境变量命名适配。

---

## 12. Docker Compose

根目录提供 `docker-compose.yml`：

服务：

- postgres
- redis，可选
- api，可选
- admin，可选

第一版至少保证：

```bash
docker compose up -d postgres
```

可启动数据库。

PostgreSQL 默认：

- database: rbac_admin
- username: postgres
- password: postgres
- port: 5432

---

## 13. package scripts

在根目录补充或保留以下脚本，按 Vben Monorepo 实际情况适配：

```json
{
  "scripts": {
    "dev:api": "pnpm -F @rbac/api start:dev",
    "dev:admin": "pnpm run dev:antd",
    "dev:rbac": "concurrently \"pnpm dev:api\" \"pnpm dev:admin\"",
    "db:generate": "pnpm -F @rbac/api prisma:generate",
    "db:migrate": "pnpm -F @rbac/api prisma:migrate",
    "db:seed": "pnpm -F @rbac/api prisma:seed",
    "rbac:init": "pnpm db:generate && pnpm db:migrate && pnpm db:seed",
    "check:rbac": "pnpm -F @rbac/api lint && pnpm -F @rbac/api test && pnpm run check:type",
    "build:api": "pnpm -F @rbac/api build",
    "build:rbac": "pnpm build:api && pnpm run build:antd"
  }
}
```

如果 Vben 原有脚本冲突，不要破坏原脚本，新增兼容脚本即可。

---

## 14. 后端测试

至少提供基础测试：

1. AuthService login 成功。
2. AuthService 密码错误失败。
3. PermissionsGuard 超级管理员放行。
4. PermissionsGuard 无权限拒绝。
5. UsersService 创建用户时 username 唯一校验。
6. RolesService 删除已绑定用户的角色时失败。

测试可以使用 Jest。

---

## 15. 验收标准

完成后必须满足以下验收标准。

### 15.1 启动验收

以下命令可以成功运行：

```bash
pnpm install
docker compose up -d postgres
pnpm rbac:init
pnpm dev:api
pnpm dev:admin
```

浏览器打开：

```txt
http://localhost:5555
```

可以看到登录页。

### 15.2 登录验收

使用：

```txt
admin / Admin@123456
```

可以登录后台。

登录后：

1. 进入 Dashboard。
2. 左侧显示 Dashboard、系统管理、系统审计。
3. 可以访问用户、角色、菜单、部门、操作日志页面。

使用：

```txt
demo / Demo@123456
```

可以登录后台。

登录后：

1. 只能看到 Dashboard 或个人中心。
2. 不能看到系统管理页面。
3. 直接访问 `/system/user` 应被前端拦截或后端拒绝。

### 15.3 权限验收

1. 新建一个角色 `test_role`。
2. 只给它分配 `用户管理列表` 权限，不给新增按钮权限。
3. 新建用户 `test_user` 并分配 `test_role`。
4. 使用 `test_user` 登录。
5. 可以看到用户管理页面。
6. 看不到新增用户按钮。
7. 直接调用新增用户接口返回 403。

### 15.4 CRUD 验收

管理员可以完成：

1. 新增用户。
2. 编辑用户。
3. 禁用用户。
4. 重置密码。
5. 分配角色。
6. 新增角色。
7. 给角色分配菜单权限。
8. 新增菜单。
9. 新增按钮权限。
10. 新增部门。
11. 查看操作日志。

### 15.5 构建验收

以下命令必须通过：

```bash
pnpm -F @rbac/api lint
pnpm -F @rbac/api test
pnpm -F @rbac/api build
pnpm run build:antd
```

如果 Vben 原本有更严格的检查命令，也尽量保证通过。

---

## 16. README 要求

必须更新根目录 README，包含：

1. 项目介绍。
2. 技术栈。
3. 环境要求。
4. 启动步骤。
5. 默认账号。
6. 目录说明。
7. 常用命令。
8. 权限模型说明。
9. 如何新增一个菜单页面。
10. 如何新增一个按钮权限。
11. 如何在后端接口上加权限。
12. 如何二开业务模块。

README 中必须写清楚：

后端接口权限示例：

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('system:user:create')
@Post()
create() {}
```

前端按钮权限示例：

```vue
<a-button v-if="hasPermission('system:user:create')">
  新增用户
</a-button>
```

---

## 17. 代码质量要求

1. 不要提交明显无用代码。
2. 不要保留大段 TODO。
3. 不要把密码明文存数据库。
4. 不要在接口中返回 passwordHash。
5. 不要破坏 Vben 原有目录结构。
6. 不要把 RBAC 逻辑写死在前端。
7. 所有权限以数据库 seed 和后端接口为准。
8. 前端只做展示控制，安全控制必须由后端完成。
9. Prisma schema、DTO、Swagger、前端类型尽量保持一致。
10. 所有新增核心函数必须有清晰命名。

---

## 18. 最终交付结果

你完成后需要保证仓库具备以下能力：

1. 一个完整的 NestJS 后端。
2. 一个基于 Vben Admin web-antd 改造后的前端。
3. PostgreSQL 数据库模型。
4. Prisma migration。
5. Prisma seed。
6. 默认管理员账号。
7. 动态菜单。
8. 按钮权限。
9. 后端接口权限 Guard。
10. 用户/角色/菜单/部门/审计日志页面。
11. Docker Compose。
12. README。
13. 可以本地启动和构建。

---

## 19. 推荐实现顺序

请按这个顺序执行，不要跳跃：

1. 检查当前仓库结构。
2. 如果不是 Vben Admin，初始化或拉取 Vben Admin 5.x。
3. 确认 `front` 可用。
4. 新建 `backend` NestJS 应用。
5. 配置 pnpm workspace。
6. 配置 Prisma schema。
7. 实现 seed。
8. 实现 Auth。
9. 实现 RBAC Guard。
10. 实现 Users/Roles/Menus/Departments/AuditLogs/Dashboard API。
11. 实现 Swagger。
12. 改造 Vben 登录。
13. 改造 Vben 动态菜单和动态路由。
14. 实现用户管理页面。
15. 实现角色管理页面。
16. 实现菜单管理页面。
17. 实现部门管理页面。
18. 实现操作日志页面。
19. 实现 Dashboard。
20. 实现个人中心。
21. 更新 README。
22. 运行数据库迁移和 seed。
23. 运行 lint/test/build。
24. 修复所有问题。
25. 输出最终完成说明和运行命令。

---

## 20. 不做的内容

第一版不要实现：

1. 多租户管理后台。
2. SaaS 套餐。
3. 复杂审批流。
4. 工作流引擎。
5. ABAC。
6. ReBAC。
7. 第三方登录。
8. SSO。
9. LDAP。
10. 微前端。
11. 代码生成器。
12. 低代码平台。
13. 在线表单设计器。

但数据库中保留 `tenantId`，方便未来升级。

---

## 21. 最终自检清单

完成前逐项确认：

- [ ] 可以安装依赖。
- [ ] 可以启动 PostgreSQL。
- [ ] Prisma migrate 成功。
- [ ] Prisma seed 成功。
- [ ] 后端启动成功。
- [ ] 前端启动成功。
- [ ] admin 可以登录。
- [ ] demo 可以登录。
- [ ] admin 可以看到系统管理。
- [ ] demo 看不到系统管理。
- [ ] 菜单从后端动态返回。
- [ ] 按钮权限生效。
- [ ] 后端接口权限生效。
- [ ] 用户管理 CRUD 可用。
- [ ] 角色管理 CRUD 可用。
- [ ] 角色分配菜单可用。
- [ ] 菜单管理 CRUD 可用。
- [ ] 部门管理 CRUD 可用。
- [ ] 操作日志可查看。
- [ ] Swagger 可访问。
- [ ] README 已更新。
- [ ] 测试通过。
- [ ] 构建通过。

---

## 22. Codex CLI 推荐执行命令

在 Codex CLI 中执行：

```txt
/goal 按照 ./GOAL.md 完整实现一个基于 NestJS + Prisma + PostgreSQL + Vben Admin 5.x web-antd 的通用 RBAC 后台底座。不要询问我，遇到未明确处按文档默认方案实现。完成后必须运行安装、迁移、seed、lint/typecheck/build/test，并修复所有失败项，直到项目可启动、可登录、核心页面可用。
```

---

## 23. 推荐 AGENTS.md

建议项目根目录也创建 `AGENTS.md`：

```md
# AGENTS.md

本仓库是一个通用 RBAC 后台底座。

技术栈：

- Frontend: Vben Admin 5.x, front, Vue 3, TypeScript, Pinia, Vue Router, Ant Design Vue
- Backend: NestJS, Prisma, PostgreSQL, JWT, Swagger
- Package manager: pnpm
- Monorepo: Vben Admin 原有 pnpm workspace + turbo

开发规则：

1. 后端接口统一前缀 `/api`。
2. 后端必须使用 DTO + class-validator。
3. 后端权限必须通过 Guard 控制，禁止只依赖前端权限。
4. 前端菜单和按钮权限必须来自后端。
5. 新增业务模块时，需要同时补充菜单 seed、权限码、后端 Guard、前端按钮权限。
6. 不要破坏 Vben 原有工程结构。
7. 不要返回 passwordHash。
8. 不要明文存储密码。
9. 所有新增页面要接入动态菜单和权限体系。
10. 修改完成后运行相关 lint、typecheck、test、build。
```
