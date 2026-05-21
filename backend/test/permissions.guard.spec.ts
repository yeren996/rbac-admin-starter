import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { PermissionsGuard } from '../src/common/guards/permissions.guard';

function ctx(user: any) {
  return {
    getClass: () => class Test {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('permissionsGuard', () => {
  it('超级管理员放行', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['system:user:create']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector, {
      roleMenu: { findMany: vi.fn() },
    } as any);

    await expect(
      guard.canActivate(ctx({ id: 'u1', isSuperAdmin: true })),
    ).resolves.toBe(true);
  });

  it('无权限拒绝', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['system:user:create']),
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector, {
      roleMenu: { findMany: vi.fn().mockResolvedValue([]) },
    } as any);

    await expect(
      guard.canActivate(ctx({ id: 'u1', isSuperAdmin: false })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
