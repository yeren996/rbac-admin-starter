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
