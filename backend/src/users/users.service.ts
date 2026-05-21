import type { CurrentUserPayload } from '../common/types/current-user';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { toPage } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignRolesDto,
  CreateUserDto,
  ResetPasswordDto,
  StatusDto,
  UpdateUserDto,
} from './dto';

const userSelect = {
  avatar: true,
  createdAt: true,
  deletedAt: true,
  email: true,
  id: true,
  isSuperAdmin: true,
  lastLoginAt: true,
  nickname: true,
  phone: true,
  status: true,
  updatedAt: true,
  userRoles: {
    select: { role: { select: { code: true, id: true, name: true } } },
  },
  username: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async assignRoles(
    id: string,
    dto: AssignRolesDto,
    actor: CurrentUserPayload,
  ) {
    await this.findOne(id, actor);
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ roleId, userId: id })),
        skipDuplicates: true,
      }),
    ]);
    await this.auditLogs.record({
      action: 'assign-role',
      actor,
      method: 'POST',
      module: 'users',
      path: `/api/system/users/${id}/roles`,
      requestBody: dto,
      targetId: id,
      targetType: 'User',
    });
    return { success: true };
  }

  async changeStatus(id: string, dto: StatusDto, actor: CurrentUserPayload) {
    const user = await this.findOne(id, actor);
    if (id === actor.id) throw new ForbiddenException('禁止禁用当前登录用户');
    if (user.username === 'admin' && dto.status === 'DISABLED')
      throw new ForbiddenException('禁止禁用系统超级管理员');
    const updated = await this.prisma.user.update({
      data: { status: dto.status },
      select: userSelect,
      where: { id },
    });
    await this.auditLogs.record({
      action: 'status',
      actor,
      method: 'PATCH',
      module: 'users',
      path: `/api/system/users/${id}/status`,
      requestBody: dto,
      targetId: id,
      targetType: 'User',
    });
    return updated;
  }

  async create(dto: CreateUserDto, actor: CurrentUserPayload) {
    await this.ensureUsernameUnique(dto.username, actor.tenantId);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          nickname: dto.nickname,
          passwordHash,
          phone: dto.phone,
          tenantId: actor.tenantId,
          username: dto.username,
        },
        select: userSelect,
      });
      if (dto.roleIds?.length) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ roleId, userId: created.id })),
          skipDuplicates: true,
        });
      }
      return tx.user.findUniqueOrThrow({
        select: userSelect,
        where: { id: created.id },
      });
    });
    await this.auditLogs.record({
      action: 'create',
      actor,
      method: 'POST',
      module: 'users',
      path: '/api/system/users',
      requestBody: { ...dto, password: undefined },
      targetId: user.id,
      targetType: 'User',
    });
    return user;
  }

  async findOne(id: string, actor: CurrentUserPayload) {
    const user = await this.prisma.user.findFirst({
      select: userSelect,
      where: { deletedAt: null, id, tenantId: actor.tenantId },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async list(
    query: Record<string, string | undefined>,
    actor: CurrentUserPayload,
  ) {
    const { page, pageSize, skip, take } = toPage(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      tenantId: actor.tenantId,
      ...(query.username
        ? { username: { contains: query.username, mode: 'insensitive' } }
        : {}),
      ...(query.nickname
        ? { nickname: { contains: query.nickname, mode: 'insensitive' } }
        : {}),
      ...(query.phone
        ? { phone: { contains: query.phone, mode: 'insensitive' } }
        : {}),
      ...(query.status
        ? { status: query.status as 'DISABLED' | 'ENABLED' }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: userSelect,
        skip,
        take,
        where,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async remove(id: string, actor: CurrentUserPayload) {
    const user = await this.findOne(id, actor);
    if (id === actor.id) throw new ForbiddenException('禁止删除当前登录用户');
    if (user.username === 'admin' || user.isSuperAdmin)
      throw new ForbiddenException('禁止删除系统超级管理员');
    await this.prisma.user.update({
      data: { deletedAt: new Date() },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'delete',
      actor,
      method: 'DELETE',
      module: 'users',
      path: `/api/system/users/${id}`,
      targetId: id,
      targetType: 'User',
    });
    return { success: true };
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
    actor: CurrentUserPayload,
  ) {
    await this.findOne(id, actor);
    await this.prisma.user.update({
      data: { passwordHash: await bcrypt.hash(dto.password, 10) },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'reset-password',
      actor,
      method: 'POST',
      module: 'users',
      path: `/api/system/users/${id}/reset-password`,
      targetId: id,
      targetType: 'User',
    });
    return { success: true };
  }

  async update(id: string, dto: UpdateUserDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const user = await this.prisma.user.update({
      data: dto,
      select: userSelect,
      where: { id },
    });
    await this.auditLogs.record({
      action: 'update',
      actor,
      method: 'PATCH',
      module: 'users',
      path: `/api/system/users/${id}`,
      requestBody: dto,
      targetId: id,
      targetType: 'User',
    });
    return user;
  }

  private async ensureUsernameUnique(username: string, tenantId: string) {
    const exists = await this.prisma.user.findFirst({
      where: { tenantId, username },
    });
    if (exists) throw new BadRequestException('用户名已存在');
  }
}
