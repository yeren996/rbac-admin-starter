import type { CurrentUserPayload } from '../types/current-user';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // RequirePermissions 装饰器没有声明权限码时，接口只需要通过 JwtAuthGuard 即可访问。
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('未登录');

    // 超级管理员是系统内置最高权限，直接放行，避免每次维护菜单后还要补齐角色绑定。
    if (user.isSuperAdmin) return true;

    // 普通用户必须通过“用户 -> 角色 -> 菜单权限码”链路命中所有 required 权限。
    // 使用 every 是为了支持一个接口同时要求多个权限码的场景。
    const rows = await this.prisma.roleMenu.findMany({
      where: {
        role: {
          status: 'ENABLED',
          userRoles: { some: { userId: user.id } },
        },
        menu: {
          permission: { in: required },
          status: 'ENABLED',
        },
      },
      select: { menu: { select: { permission: true } } },
    });

    const owned = new Set(
      rows.map((row) => row.menu.permission).filter(Boolean),
    );
    const allowed = required.every((code) => owned.has(code));
    if (!allowed) throw new ForbiddenException('无权限访问');
    return true;
  }
}
