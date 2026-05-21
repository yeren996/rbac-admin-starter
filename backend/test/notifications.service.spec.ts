import { describe, expect, it, vi } from 'vitest';

import { NotificationsService } from '../src/notifications/notifications.service';

const user = {
  id: 'u1',
  isSuperAdmin: true,
  nickname: '管理员',
  tenantId: 't1',
  username: 'admin',
};

const normalUser = {
  ...user,
  id: 'u2',
  isSuperAdmin: false,
  nickname: '普通用户',
  username: 'demo',
};

function createService() {
  const prisma = {
    auditLog: {
      findMany: vi.fn().mockResolvedValue([
        {
          action: 'login',
          actorUsername: 'admin',
          createdAt: new Date('2026-05-20T10:00:00.000Z'),
          id: 'log1',
          method: 'POST',
          path: '/api/auth/login',
        },
      ]),
    },
  } as any;
  return { prisma, service: new NotificationsService(prisma) };
}

describe('notificationsService', () => {
  it('返回当前用户通知并计算未读数', async () => {
    const { service } = createService();

    const items = await service.list(user);
    const unread = await service.unreadCount(user);

    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]?.title).toContain('RBAC Admin Starter');
    expect(unread.count).toBe(items.length);
  });

  it('支持标记已读和清空通知', async () => {
    const { service } = createService();

    await service.markRead(user, `welcome:${user.id}`);
    expect((await service.list(user))[0]?.isRead).toBe(true);

    await service.clear(user);
    expect(await service.list(user)).toEqual([]);
  });

  it('支持查看通知详情和全部消息分页', async () => {
    const { service } = createService();

    const detail = await service.detail(user, `welcome:${user.id}`);
    const page = await service.page({ page: '1', pageSize: '2' }, user);

    expect(detail.message).toContain('当前登录用户');
    expect(detail.query?.id).toBe(`welcome:${user.id}`);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBeGreaterThanOrEqual(3);
  });

  it('通知文案支持 Accept-Language 切换', async () => {
    const { service } = createService();

    const [zh] = await service.list(user, 'zh-CN');
    const [en] = await service.list(user, 'en-US');

    expect(zh?.title).toBe('欢迎使用 RBAC Admin Starter');
    expect(en?.title).toBe('Welcome to RBAC Admin Starter');
  });

  it('普通用户查看通知详情时不返回扩展信息', async () => {
    const { service } = createService();

    const detail = await service.detail(normalUser, `welcome:${normalUser.id}`);
    const page = await service.page({ page: '1', pageSize: '10' }, normalUser);

    expect(detail.detail).toBeUndefined();
    expect(page.items.every((item) => item.detail === undefined)).toBe(true);
  });
});
