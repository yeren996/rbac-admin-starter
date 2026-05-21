# 目标说明：无部门模块分支

本分支用于提供一个更轻量的 RBAC Admin Starter 变体：保留用户、角色、菜单、审计日志、通知中心、个人中心与 Dashboard，移除部门/组织架构模块。

## 范围

- 保留：登录认证、动态菜单、按钮权限、后端接口权限、用户管理、角色管理、菜单管理、审计日志、通知中心、个人中心。
- 移除：部门数据模型、部门 CRUD API、部门菜单权限、用户部门字段、前端部门页面、用户页面部门筛选/选择。
- Dashboard 只统计用户、角色、菜单与最近操作日志。

## 数据模型

- `Tenant` 不再关联 `Department`。
- `User` 不再包含 `deptId` 或部门关系。
- 初始 migration 不再创建 `Department` 表。

## 默认种子数据

`pnpm db:seed` 写入默认租户、角色、菜单、用户与权限绑定，不再创建组织架构数据。

## 验收标准

- 后端不暴露 `/api/system/departments` 相关接口。
- 前端不显示部门菜单或部门选择控件。
- `pnpm -F @rbac/api test`、`pnpm run check:type`、`pnpm run lint`、`pnpm run build:rbac` 均通过。
