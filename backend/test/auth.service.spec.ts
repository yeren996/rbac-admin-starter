import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';

import { AuthService, buildRouteTree } from '../src/auth/auth.service';

function createService(user: any) {
  const prisma = {
    user: {
      findFirst: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    },
  } as any;
  const audit = { record: vi.fn().mockResolvedValue(null) } as any;
  const service = new AuthService(prisma, new JwtService(), audit);
  return { audit, prisma, service };
}

describe('authService', () => {
  it('login 成功返回 accessToken', async () => {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const { service } = createService({
      avatar: null,
      id: 'u1',
      isSuperAdmin: true,
      nickname: '超级管理员',
      passwordHash,
      status: 'ENABLED',
      tenantId: 't1',
      username: 'admin',
    });

    const result = await service.login({
      password: 'Admin@123456',
      username: 'admin',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.username).toBe('admin');
  });

  it('login 密码错误失败', async () => {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const { service } = createService({
      id: 'u1',
      isSuperAdmin: true,
      nickname: '超级管理员',
      passwordHash,
      status: 'ENABLED',
      tenantId: 't1',
      username: 'admin',
    });

    await expect(
      service.login({ password: 'bad', username: 'admin' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('动态路由会移除无可访问子菜单的空目录', () => {
    const menus = [
      {
        component: 'views/dashboard/overview/index',
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
        externalLink: null,
        hidden: false,
        icon: 'lucide:layout-dashboard',
        id: 'dashboard',
        keepAlive: true,
        name: 'Dashboard',
        parentId: null,
        path: '/dashboard',
        permission: 'dashboard:overview',
        redirect: null,
        sort: 1,
        status: 'ENABLED',
        tenantId: 't1',
        title: 'Dashboard',
        type: 'MENU',
        updatedAt: new Date('2026-01-01'),
      },
      {
        component: null,
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
        externalLink: null,
        hidden: false,
        icon: 'lucide:settings',
        id: 'system',
        keepAlive: false,
        name: 'System',
        parentId: null,
        path: '/system',
        permission: null,
        redirect: null,
        sort: 10,
        status: 'ENABLED',
        tenantId: 't1',
        title: '系统管理',
        type: 'DIRECTORY',
        updatedAt: new Date('2026-01-01'),
      },
    ] as any;

    expect(buildRouteTree(menus).map((item) => item.name)).toEqual([
      'Dashboard',
    ]);
  });

  it('动态路由标题支持按语言返回', () => {
    const menus = [
      {
        component: '/system/user/index',
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
        externalLink: null,
        hidden: false,
        icon: 'carbon:user-role',
        id: 'user',
        keepAlive: false,
        name: 'SystemUser',
        parentId: null,
        path: '/system/user',
        permission: 'system:user:list',
        redirect: null,
        sort: 1,
        status: 'ENABLED',
        tenantId: 't1',
        title: '用户管理',
        type: 'MENU',
        updatedAt: new Date('2026-01-01'),
      },
    ] as any;

    expect(buildRouteTree(menus, 'en-US')[0]?.meta.title).toBe('Users');
    expect(buildRouteTree(menus, 'zh-CN')[0]?.meta.title).toBe('用户管理');
  });

  it('通知列表菜单支持按语言返回标题', () => {
    const menus = [
      {
        component: '/notification/list/index',
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
        externalLink: null,
        hidden: false,
        icon: 'carbon:notification',
        id: 'notification-list',
        keepAlive: false,
        name: 'NotificationList',
        parentId: null,
        path: '/notifications',
        permission: 'notification:list',
        redirect: null,
        sort: 2,
        status: 'ENABLED',
        tenantId: 't1',
        title: '通知列表',
        type: 'MENU',
        updatedAt: new Date('2026-01-01'),
      },
    ] as any;

    expect(buildRouteTree(menus, 'en-US')[0]?.meta.title).toBe('Notifications');
    expect(buildRouteTree(menus, 'zh-CN')[0]?.meta.title).toBe('通知列表');
  });

  it('通知管理菜单支持按语言返回标题', () => {
    const menus = [
      {
        component: '/system/notification/index',
        createdAt: new Date('2026-01-01'),
        deletedAt: null,
        externalLink: null,
        hidden: false,
        icon: 'carbon:notification',
        id: 'notification',
        keepAlive: false,
        name: 'SystemNotification',
        parentId: null,
        path: '/system/notification',
        permission: 'system:notification:list',
        redirect: null,
        sort: 5,
        status: 'ENABLED',
        tenantId: 't1',
        title: '通知管理',
        type: 'MENU',
        updatedAt: new Date('2026-01-01'),
      },
    ] as any;

    expect(buildRouteTree(menus, 'en-US')[0]?.meta.title).toBe(
      'Notification Management',
    );
    expect(buildRouteTree(menus, 'zh-CN')[0]?.meta.title).toBe('通知管理');
  });
});
