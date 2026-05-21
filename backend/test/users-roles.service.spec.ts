import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { RolesService } from '../src/roles/roles.service';
import { UsersService } from '../src/users/users.service';

const actor = {
  id: 'admin',
  isSuperAdmin: true,
  nickname: 'Admin',
  tenantId: 't1',
  username: 'admin',
};

describe('usersService', () => {
  it('创建用户时 username 唯一校验', async () => {
    const prisma = {
      user: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'exists', username: 'demo' }),
      },
    } as any;
    const service = new UsersService(prisma, { record: vi.fn() } as any);

    await expect(
      service.create(
        { nickname: 'Demo', password: 'Demo@123456', username: 'demo' },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('rolesService', () => {
  it('删除已绑定用户的角色时失败', async () => {
    const prisma = {
      role: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'r1', isSystem: false, tenantId: 't1' }),
      },
      userRole: { count: vi.fn().mockResolvedValue(1) },
    } as any;
    const service = new RolesService(prisma, { record: vi.fn() } as any);

    await expect(service.remove('r1', actor)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
