import type { CurrentUserPayload } from '../common/types/current-user';

import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Menu, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto } from './dto';

interface RefreshPayload {
  sub: string;
  tenantId: string;
  username: string;
  type: 'refresh';
}

export type MenuLocale = 'en-US' | 'zh-CN';

const MENU_TITLE_I18N: Record<string, Record<MenuLocale, string>> = {
  Dashboard: { 'en-US': 'Dashboard', 'zh-CN': '概览' },
  分配菜单: { 'en-US': 'Assign Menus', 'zh-CN': '分配菜单' },
  分配角色: { 'en-US': 'Assign Roles', 'zh-CN': '分配角色' },
  删除用户: { 'en-US': 'Delete User', 'zh-CN': '删除用户' },
  删除角色: { 'en-US': 'Delete Role', 'zh-CN': '删除角色' },
  删除菜单: { 'en-US': 'Delete Menu', 'zh-CN': '删除菜单' },
  个人中心: { 'en-US': 'Profile', 'zh-CN': '个人中心' },
  新增用户: { 'en-US': 'Create User', 'zh-CN': '新增用户' },
  新增角色: { 'en-US': 'Create Role', 'zh-CN': '新增角色' },
  新增菜单: { 'en-US': 'Create Menu', 'zh-CN': '新增菜单' },
  标记通知: { 'en-US': 'Mark Notification', 'zh-CN': '标记通知' },
  操作日志: { 'en-US': 'Audit Logs', 'zh-CN': '操作日志' },
  清空通知: { 'en-US': 'Clear Notifications', 'zh-CN': '清空通知' },
  用户管理: { 'en-US': 'Users', 'zh-CN': '用户管理' },
  系统审计: { 'en-US': 'Audit', 'zh-CN': '系统审计' },
  系统管理: { 'en-US': 'System', 'zh-CN': '系统管理' },
  编辑用户: { 'en-US': 'Edit User', 'zh-CN': '编辑用户' },
  编辑角色: { 'en-US': 'Edit Role', 'zh-CN': '编辑角色' },
  编辑菜单: { 'en-US': 'Edit Menu', 'zh-CN': '编辑菜单' },
  菜单管理: { 'en-US': 'Menus', 'zh-CN': '菜单管理' },
  通知列表: { 'en-US': 'Notifications', 'zh-CN': '通知列表' },
  通知管理: { 'en-US': 'Notification Management', 'zh-CN': '通知管理' },
  角色管理: { 'en-US': 'Roles', 'zh-CN': '角色管理' },
  重置密码: { 'en-US': 'Reset Password', 'zh-CN': '重置密码' },
  删除通知: { 'en-US': 'Delete Notification', 'zh-CN': '删除通知' },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async changePassword(user: CurrentUserPayload, dto: ChangePasswordDto) {
    const entity = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const ok = await bcrypt.compare(dto.oldPassword, entity.passwordHash);
    if (!ok) throw new ForbiddenException('旧密码错误');
    await this.prisma.user.update({
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
      where: { id: user.id },
    });
    return { success: true };
  }

  async getPermissions(user: CurrentUserPayload) {
    // 权限码来自菜单按钮配置，是前端按钮级权限和后端接口权限共同使用的最小授权单元。
    const where: Prisma.MenuWhereInput = {
      deletedAt: null,
      permission: { not: null },
      status: 'ENABLED',
      tenantId: user.tenantId,
      ...(user.isSuperAdmin
        ? {}
        : {
            roleMenus: {
              some: {
                role: {
                  status: 'ENABLED',
                  userRoles: { some: { userId: user.id } },
                },
              },
            },
          }),
    };
    const rows = await this.prisma.menu.findMany({
      select: { permission: true },
      where,
    });
    return [
      ...new Set(rows.map((row) => row.permission).filter(Boolean) as string[]),
    ];
  }

  async getRoleCodes(user: CurrentUserPayload) {
    const rows = await this.prisma.userRole.findMany({
      where: { userId: user.id, role: { deletedAt: null, status: 'ENABLED' } },
      select: { role: { select: { code: true } } },
    });
    return rows.map((row) => row.role.code);
  }

  async getRouteMenus(user: CurrentUserPayload, acceptLanguage?: string) {
    // 动态路由只返回 DIRECTORY/MENU，BUTTON 仅作为权限码存在，不参与左侧菜单渲染。
    const where: Prisma.MenuWhereInput = {
      deletedAt: null,
      status: 'ENABLED',
      tenantId: user.tenantId,
      type: { in: ['DIRECTORY', 'MENU'] },
      ...(user.isSuperAdmin
        ? {}
        : {
            OR: [
              { permission: null },
              {
                roleMenus: {
                  some: {
                    role: {
                      status: 'ENABLED',
                      userRoles: { some: { userId: user.id } },
                    },
                  },
                },
              },
            ],
          }),
    };
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      where,
    });
    return buildRouteTree(menus, resolveMenuLocale(acceptLanguage));
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { deletedAt: null, username: dto.username },
    });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    if (user.status !== 'ENABLED') throw new ForbiddenException('用户已被禁用');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    await this.prisma.user.update({
      data: { lastLoginAt: new Date() },
      where: { id: user.id },
    });

    // 登录成功后记录审计日志，后续通知中心会基于这些真实操作日志生成提醒。
    await this.auditLogs.record({
      action: 'login',
      method: 'POST',
      module: 'auth',
      path: '/api/auth/login',
      tenantId: user.tenantId,
      actor: {
        id: user.id,
        isSuperAdmin: user.isSuperAdmin,
        nickname: user.nickname,
        tenantId: user.tenantId,
        username: user.username,
      },
      responseStatus: 200,
    });

    const tokens = await this.signTokens({
      id: user.id,
      isSuperAdmin: user.isSuperAdmin,
      nickname: user.nickname,
      tenantId: user.tenantId,
      username: user.username,
    });
    return {
      ...tokens,
      expiresIn: 7200,
      user: this.toLoginUser(user),
    };
  }

  async me(user: CurrentUserPayload, acceptLanguage?: string) {
    const [roles, permissions, menus] = await Promise.all([
      this.getRoleCodes(user),
      this.getPermissions(user),
      this.getRouteMenus(user, acceptLanguage),
    ]);
    return {
      menus,
      permissions,
      roles,
      user: {
        avatar: null,
        id: user.id,
        isSuperAdmin: user.isSuperAdmin,
        nickname: user.nickname,
        username: user.username,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        },
      );
      if (payload.type !== 'refresh')
        throw new UnauthorizedException('刷新令牌无效');
      const user = await this.prisma.user.findFirst({
        where: { deletedAt: null, id: payload.sub, status: 'ENABLED' },
      });
      if (!user) throw new UnauthorizedException('刷新令牌无效');
      const accessToken = await this.jwt.signAsync(
        {
          isSuperAdmin: user.isSuperAdmin,
          sub: user.id,
          tenantId: user.tenantId,
          username: user.username,
        },
        {
          expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '2h') as any,
          secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
        },
      );
      return { accessToken, expiresIn: 7200 };
    } catch {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  async updateProfile(
    user: CurrentUserPayload,
    dto: { avatar?: string; nickname?: string },
  ) {
    const updated = await this.prisma.user.update({
      data: { avatar: dto.avatar, nickname: dto.nickname },
      select: { avatar: true, id: true, nickname: true, username: true },
      where: { id: user.id },
    });
    return updated;
  }

  async userInfo(user: CurrentUserPayload) {
    const roles = await this.getRoleCodes(user);
    return {
      avatar: '',
      desc: user.isSuperAdmin ? '系统超级管理员' : 'RBAC 用户',
      homePath: '/dashboard',
      realName: user.nickname,
      roles,
      token: '',
      userId: user.id,
      username: user.username,
    };
  }

  private async signTokens(user: CurrentUserPayload) {
    const payload = {
      isSuperAdmin: user.isSuperAdmin,
      sub: user.id,
      tenantId: user.tenantId,
      username: user.username,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '2h') as any,
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      }),
      this.jwt.signAsync(
        { ...payload, type: 'refresh' },
        {
          expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
          secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private toLoginUser(user: {
    avatar: null | string;
    id: string;
    isSuperAdmin: boolean;
    nickname: string;
    username: string;
  }) {
    return {
      avatar: user.avatar,
      id: user.id,
      isSuperAdmin: user.isSuperAdmin,
      nickname: user.nickname,
      username: user.username,
    };
  }
}

interface RouteNode {
  children?: RouteNode[];
  component?: null | string;
  meta: Record<string, unknown>;
  name: string;
  path: string;
  redirect?: null | string;
}

export function buildRouteTree(
  menus: Menu[],
  locale: MenuLocale = 'zh-CN',
): RouteNode[] {
  const map = new Map<string, RouteNode>();
  for (const menu of menus) {
    if (!menu.name || !menu.path) continue;
    map.set(menu.id, {
      component: menu.component,
      meta: {
        hideInMenu: menu.hidden,
        icon: menu.icon || undefined,
        keepAlive: menu.keepAlive,
        order: menu.sort,
        title: localizeMenuTitle(menu.title, locale),
        ...(menu.externalLink ? { link: menu.externalLink } : {}),
      },
      name: menu.name,
      path: menu.path,
      redirect: menu.redirect,
    });
  }
  const roots: RouteNode[] = [];
  for (const menu of menus) {
    const node = map.get(menu.id);
    if (!node) continue;
    if (menu.parentId && map.has(menu.parentId)) {
      const parent = map.get(menu.parentId);
      if (parent) {
        parent.children ??= [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }
  return pruneEmptyDirectoryRoutes(roots);
}

function resolveMenuLocale(acceptLanguage?: string): MenuLocale {
  return acceptLanguage?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

function localizeMenuTitle(title: string, locale: MenuLocale) {
  return MENU_TITLE_I18N[title]?.[locale] ?? title;
}

function pruneEmptyDirectoryRoutes(nodes: RouteNode[]): RouteNode[] {
  return nodes
    .map((node) => {
      if (node.children) {
        node.children = pruneEmptyDirectoryRoutes(node.children);
      }
      return node;
    })
    .filter((node) => node.component || (node.children?.length ?? 0) > 0);
}
