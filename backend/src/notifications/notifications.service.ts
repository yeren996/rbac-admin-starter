import type { CurrentUserPayload } from '../common/types/current-user';

import { Injectable, NotFoundException } from '@nestjs/common';

import { toPage } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationItemDto {
  avatar: string;
  date: string;
  detail?: Record<string, unknown>;
  id: string;
  isRead: boolean;
  link?: string;
  message: string;
  query?: Record<string, string>;
  source: 'audit' | 'security' | 'system';
  title: string;
}

interface NotificationState {
  dismissed: Set<string>;
  read: Set<string>;
}

type NotificationLocale = 'en-US' | 'zh-CN';

const NOTIFICATION_TEXT: Record<
  NotificationLocale,
  {
    auditMessage: (
      actor: null | string,
      method: string,
      path: string,
    ) => string;
    auditTitle: (action: string) => string;
    securityDetail: string;
    securityMessage: string;
    securityTitle: string;
    welcomeDetail: string;
    welcomeMessage: (nickname: string, username: string) => string;
    welcomeTitle: string;
  }
> = {
  'en-US': {
    auditMessage: (actor, method, path) =>
      `${actor || 'System'} executed ${method} ${path}`,
    auditTitle: (action) => `Audit log: ${action}`,
    securityDetail:
      'Change passwords regularly, disable resigned accounts promptly, and grant only required menu permissions to roles.',
    securityMessage:
      'Please update your password regularly and assign roles by least privilege.',
    securityTitle: 'Account security reminder',
    welcomeDetail:
      'Use Notifications to view system, security, and audit reminders.',
    welcomeMessage: (nickname, username) =>
      `Current user: ${nickname || username}. You can view personal notifications in Notifications.`,
    welcomeTitle: 'Welcome to RBAC Admin Starter',
  },
  'zh-CN': {
    auditMessage: (actor, method, path) =>
      `${actor || '系统'} 执行 ${method} ${path}`,
    auditTitle: (action) => `操作日志：${action}`,
    securityDetail:
      '定期修改密码、及时停用离职账号、只给角色分配必要菜单权限。',
    securityMessage: '建议定期更新密码，并按最小权限原则分配角色菜单。',
    securityTitle: '账号安全提醒',
    welcomeDetail: '可以在通知列表查看系统、安全与审计提醒。',
    welcomeMessage: (nickname, username) =>
      `当前登录用户：${nickname || username}，可在通知列表查看个人通知。`,
    welcomeTitle: '欢迎使用 RBAC Admin Starter',
  },
};

/**
 * 顶部栏通知服务。
 *
 * 当前项目是可二开的 RBAC 底座，通知中心先实现为“轻量读模型”：
 * - 通知内容来自登录用户、审计日志等已有业务事实，不新增数据库表，避免为了演示功能引入迁移成本；
 * - 已读/删除状态保存在进程内存中，适合本地开发和模板演示；
 * - 如果生产环境需要跨实例、持久化或推送能力，可在保持 Controller 契约不变的前提下替换为数据库表、Redis 或消息队列。
 */
@Injectable()
export class NotificationsService {
  /** key 为 user.id，value 保存该用户在当前进程中的通知已读/删除状态。 */
  private readonly states = new Map<string, NotificationState>();

  constructor(private readonly prisma: PrismaService) {}

  async clear(user: CurrentUserPayload) {
    const state = this.getState(user.id);
    const items = await this.buildNotifications(user);
    for (const item of items) {
      state.dismissed.add(item.id);
      state.read.add(item.id);
    }
    return { success: true };
  }

  async detail(
    user: CurrentUserPayload,
    id: string,
    acceptLanguage?: string,
  ): Promise<NotificationItemDto> {
    const item = (await this.list(user, acceptLanguage)).find(
      (item) => item.id === id,
    );
    if (!item) throw new NotFoundException('通知不存在或已被清除');
    return item;
  }

  async list(
    user: CurrentUserPayload,
    acceptLanguage?: string,
  ): Promise<NotificationItemDto[]> {
    const state = this.getState(user.id);
    const items = await this.buildNotifications(
      user,
      resolveNotificationLocale(acceptLanguage),
    );

    return items
      .filter((item) => !state.dismissed.has(item.id))
      .map((item) => ({
        ...item,
        isRead: item.isRead || state.read.has(item.id),
      }))
      .map((item) => this.sanitizeForUser(item, user));
  }

  async markAllRead(user: CurrentUserPayload) {
    const state = this.getState(user.id);
    const items = await this.buildNotifications(user);
    for (const item of items) {
      state.read.add(item.id);
    }
    return { success: true };
  }

  markRead(user: CurrentUserPayload, id: string) {
    this.getState(user.id).read.add(id);
    return { success: true };
  }

  async page(
    query: Record<string, string | undefined>,
    user: CurrentUserPayload,
    acceptLanguage?: string,
  ) {
    const { page, pageSize, skip, take } = toPage(query);
    const keyword = query.keyword?.trim().toLowerCase();
    const source = query.source?.trim();
    const isRead =
      query.isRead === 'true'
        ? true
        : query.isRead === 'false'
          ? false
          : undefined;

    /**
     * 管理页复用顶部栏同一套读模型，保证“铃铛看到的消息”和“全部消息列表”
     * 口径一致。这里先在内存中过滤分页，后续如果通知落库，只需把筛选下推到 SQL。
     */
    const filtered = (await this.list(user, acceptLanguage)).filter((item) => {
      const matchKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.message.toLowerCase().includes(keyword);
      const matchSource = !source || item.source === source;
      const matchRead = isRead === undefined || item.isRead === isRead;
      return matchKeyword && matchSource && matchRead;
    });

    return {
      items: filtered.slice(skip, skip + take),
      page,
      pageSize,
      total: filtered.length,
    };
  }

  remove(user: CurrentUserPayload, id: string) {
    const state = this.getState(user.id);
    state.dismissed.add(id);
    state.read.add(id);
    return { success: true };
  }

  async unreadCount(user: CurrentUserPayload) {
    const items = await this.list(user);
    return { count: items.filter((item) => !item.isRead).length };
  }

  /**
   * 从真实业务数据生成通知列表。
   * 欢迎与安全提醒保证新系统也能展示通知；审计日志让通知中心能反映真实后台操作。
   */
  private async buildNotifications(
    user: CurrentUserPayload,
    locale: NotificationLocale = 'zh-CN',
  ): Promise<NotificationItemDto[]> {
    const text = NOTIFICATION_TEXT[locale];
    const recentLogs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        actorUsername: true,
        createdAt: true,
        id: true,
        method: true,
        path: true,
      },
      take: 4,
      where: { tenantId: user.tenantId },
    });

    const builtInItems: NotificationItemDto[] = [
      {
        avatar: '/rbac-avatar.svg',
        date: new Date().toISOString(),
        detail: {
          loginUser: user.username,
          tenantId: user.tenantId,
          tip: text.welcomeDetail,
        },
        id: `welcome:${user.id}`,
        isRead: false,
        link: '/notifications',
        message: text.welcomeMessage(user.nickname, user.username),
        query: { id: `welcome:${user.id}` },
        source: 'system',
        title: text.welcomeTitle,
      },
      {
        avatar: '/rbac-avatar.svg',
        date: new Date().toISOString(),
        detail: {
          suggestion: text.securityDetail,
        },
        id: `security:${user.id}`,
        isRead: false,
        link: '/notifications',
        message: text.securityMessage,
        query: { id: `security:${user.id}` },
        source: 'security',
        title: text.securityTitle,
      },
    ];

    const auditItems = recentLogs.map((log) => ({
      avatar: '/rbac-avatar.svg',
      date: log.createdAt.toISOString(),
      detail: {
        action: log.action,
        actorUsername: log.actorUsername,
        method: log.method,
        path: log.path,
      },
      id: `audit:${log.id}`,
      isRead: false,
      link: '/notifications',
      message: text.auditMessage(log.actorUsername, log.method, log.path),
      query: { id: `audit:${log.id}` },
      source: 'audit' as const,
      title: text.auditTitle(log.action),
    }));

    return [...builtInItems, ...auditItems];
  }

  private getState(userId: string): NotificationState {
    let state = this.states.get(userId);
    if (!state) {
      state = { dismissed: new Set<string>(), read: new Set<string>() };
      this.states.set(userId, state);
    }
    return state;
  }

  /**
   * 普通用户只需要看“标题、内容、来源、时间”等业务可读信息。
   * detail 中包含 tenantId、审计字段等排障信息，默认仅超级管理员可见，避免把实现细节暴露给普通账号。
   */
  private sanitizeForUser(
    item: NotificationItemDto,
    user: CurrentUserPayload,
  ): NotificationItemDto {
    if (user.isSuperAdmin) return item;

    const { detail, ...visibleItem } = item;
    void detail;
    return visibleItem;
  }
}

function resolveNotificationLocale(
  acceptLanguage?: string,
): NotificationLocale {
  return acceptLanguage?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}
