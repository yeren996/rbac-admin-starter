# RBAC Admin Starter

基于 **NestJS + Prisma + PostgreSQL + Vben Admin 5.x（front）** 的通用后台管理底座，提供登录认证、动态菜单、按钮权限、后端接口权限、用户/角色/菜单/审计日志、顶部栏设置、中英文切换和通知中心等基础能力，适合在此基础上二次开发业务模块。

扩展文档：

- [产品说明](./docs/PRODUCT.md)
- [使用手册](./docs/USER_MANUAL.md)

## 技术栈

| 分层 | 技术 |
| --- | --- |
| 前端 | Vben Admin 5.x、Vue 3、TypeScript、Pinia、Vue Router、Ant Design Vue |
| 后端 | NestJS、TypeScript、Passport、JWT、class-validator、Swagger |
| 数据层 | PostgreSQL、Prisma ORM、bcrypt |
| 工程化 | pnpm workspace、Turbo、Docker Compose、ESLint、Vitest |

## 环境要求

- Node.js：建议使用仓库 `package.json` 声明的版本（`^22.18.0 || ^24.0.0`）
- pnpm：`>= 10`
- Docker / Docker Compose：用于启动 PostgreSQL
- PostgreSQL：默认由 `docker compose up -d postgres` 启动

## 快速启动

```bash
pnpm install
cp backend/.env.example backend/.env

docker compose up -d postgres
pnpm rbac:init

# 终端 1：后端
pnpm dev:api

# 终端 2：前端
pnpm dev:admin
```

访问地址：

- 前端登录页：<http://localhost:5555>
- 后端 API：<http://localhost:3000/api>
- Swagger 文档：<http://localhost:3000/api/docs>

前端开发环境接口地址在 `front/.env.development` 中配置：

```env
VITE_GLOB_API_URL=http://localhost:3000/api
```

## 默认账号

| 账号    | 密码           | 说明                                    |
| ------- | -------------- | --------------------------------------- |
| `admin` | `Admin@123456` | 超级管理员，拥有全部菜单与按钮权限      |
| `demo`  | `Demo@123456`  | 演示用户，只能访问 Dashboard 和个人中心 |

## 目录说明

当前仓库已按 RBAC 底座做精简：业务入口只保留 `front`、`backend`，Vben 共享包与工程脚本统一收纳到 `workspace`。

```txt
.
├── front                # Vben Admin Ant Design Vue 前端
│   └── src              # 前端页面、路由、状态与 API 封装
├── backend              # NestJS 后端
│   ├── prisma           # Prisma schema、migration、seed
│   ├── src              # 后端模块源码
│   └── test             # 后端基础测试
├── docs
│   ├── GOAL.md          # 无部门分支目标说明
│   ├── PRODUCT.md       # 产品说明
│   └── USER_MANUAL.md   # 使用手册
├── workspace
│   ├── packages         # Vben 前端共享包
│   ├── internal         # Vben 工程化配置包
│   └── scripts          # Monorepo 工具脚本
├── docker-compose.yml   # PostgreSQL/Redis 本地依赖
└── README.md            # 启动与二开说明
```

## 常用命令

| 命令                     | 用途                             |
| ------------------------ | -------------------------------- |
| `pnpm dev:api`           | 启动 NestJS 后端                 |
| `pnpm dev:admin`         | 启动 `front` 前端                |
| `pnpm dev:rbac`          | 同时启动前后端                   |
| `pnpm db:generate`       | 生成 Prisma Client               |
| `pnpm db:migrate`        | 执行 Prisma migration            |
| `pnpm db:seed`           | 写入默认租户、角色、菜单、用户   |
| `pnpm rbac:init`         | 依次执行 generate、migrate、seed |
| `pnpm -F @rbac/api test` | 运行后端测试                     |
| `pnpm -F @rbac/api lint` | 后端 TypeScript 检查             |
| `pnpm run check:rbac`    | 后端检查 + 测试 + 全仓类型检查   |
| `pnpm run build:rbac`    | 构建后端和 `front` 前端          |

## 权限模型说明

第一版采用经典 RBAC（基于角色的访问控制）：

```txt
用户 User
  -> 用户角色 UserRole
    -> 角色 Role
      -> 角色菜单 RoleMenu
        -> 菜单/按钮 Menu
```

菜单表 `Menu` 同时承载三类数据：

| 类型        | 作用                                            |
| ----------- | ----------------------------------------------- |
| `DIRECTORY` | 左侧目录分组，不直接渲染页面                    |
| `MENU`      | 页面路由，控制用户能访问哪些页面                |
| `BUTTON`    | 按钮/接口权限码，控制页面按钮展示与后端接口访问 |

前端权限只用于展示控制，真正的安全拦截由后端 `JwtAuthGuard` + `PermissionsGuard` 完成。

## 顶部栏能力

| 功能 | 说明 |
| --- | --- |
| 设置 | 顶部栏齿轮按钮打开偏好设置抽屉，可调整布局、主题、语言和部件显示 |
| 中英文切换 | 顶部栏语言按钮切换 `zh-CN` / `en-US`，刷新后后端动态菜单会按 `Accept-Language` 返回对应标题 |
| 通知 | 顶部栏铃铛从 `/api/notifications` 拉取当前用户通知，支持已读、全部已读、删除和清空 |

模板自带的推广/广告/外部文档入口已从前端路由、用户菜单和工作台移除，当前导航只保留 RBAC 业务相关入口。

## 如何新增一个菜单页面

1. 在 `front/src/views` 下新增页面组件，例如：

```txt
front/src/views/business/order/index.vue
```

2. 在 `backend/prisma/seed.ts` 中新增 `MENU` 类型记录，关键字段示例：

```ts
{
  title: '订单管理',
  name: 'BusinessOrder',
  path: '/business/order',
  component: 'views/business/order/index',
  permission: 'business:order:list',
  type: 'MENU',
}
```

3. 将该菜单授权给对应角色（seed 中维护 `RoleMenu`，或在角色管理页面分配）。
4. 执行 `pnpm db:seed` 或在后台菜单管理中新增相同配置。

## 如何新增一个按钮权限

1. 在菜单管理中给目标页面新增 `BUTTON` 类型权限，或在 `seed.ts` 中增加按钮记录：

```ts
{
  title: '新增订单',
  permission: 'business:order:create',
  type: 'BUTTON',
}
```

2. 前端页面使用权限工具函数控制按钮展示：

```vue
<a-button v-if="hasPermission('system:user:create')">
  新增用户
</a-button>
```

3. 将按钮权限授权给需要的角色。

## 如何在后端接口上加权限

后端接口必须同时启用 JWT 登录校验和权限校验：

```ts
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('system:user:create')
@Post()
create() {}
```

如果当前用户是 `isSuperAdmin = true`，`PermissionsGuard` 会直接放行；普通用户必须通过角色拥有对应 `permission` 权限码才可访问。

## 如何二开业务模块

建议按以下步骤新增业务能力：

1. **建模**：在 `backend/prisma/schema.prisma` 新增业务表，必要时关联 `tenantId`、`createdAt`、`updatedAt`、`deletedAt`。
2. **迁移**：执行 `pnpm db:migrate`，提交生成的 migration。
3. **后端模块**：在 `backend/src` 下新增 NestJS module/service/controller/dto，并接入 Swagger、ValidationPipe、权限 Guard。
4. **权限种子**：在 `backend/prisma/seed.ts` 增加菜单、按钮权限码，并授权给默认角色。
5. **前端页面**：在 `front/src/views` 增加页面，通过 `src/api/rbac.ts` 或新的 API 文件接入后端。
6. **按钮控制**：在页面中使用 `hasPermission`、`hasAnyPermission` 或 `hasAllPermissions` 控制按钮展示。
7. **验证**：运行 `pnpm run check:rbac` 和 `pnpm run build:rbac`，再用不同角色账号验证页面、按钮和接口权限。

## 质量检查

本项目完成后应至少通过：

```bash
pnpm -F @rbac/api lint
pnpm -F @rbac/api test
pnpm -F @rbac/api build
pnpm run build:antd
pnpm run check:rbac
pnpm run build:rbac
```
