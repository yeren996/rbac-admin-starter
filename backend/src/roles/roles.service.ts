import type { CurrentUserPayload } from '../common/types/current-user';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { toPage } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';
import { AssignMenusDto, CreateRoleDto, StatusDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async assignMenus(
    id: string,
    dto: AssignMenusDto,
    actor: CurrentUserPayload,
  ) {
    await this.findOne(id, actor);
    await this.prisma.$transaction([
      this.prisma.roleMenu.deleteMany({ where: { roleId: id } }),
      this.prisma.roleMenu.createMany({
        data: dto.menuIds.map((menuId) => ({ menuId, roleId: id })),
        skipDuplicates: true,
      }),
    ]);
    await this.auditLogs.record({
      action: 'assign-menu',
      actor,
      method: 'POST',
      module: 'roles',
      path: `/api/system/roles/${id}/menus`,
      requestBody: dto,
      targetId: id,
      targetType: 'Role',
    });
    return { success: true };
  }

  async changeStatus(id: string, dto: StatusDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const role = await this.prisma.role.update({
      data: { status: dto.status },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'status',
      actor,
      method: 'PATCH',
      module: 'roles',
      path: `/api/system/roles/${id}/status`,
      requestBody: dto,
      targetId: id,
      targetType: 'Role',
    });
    return role;
  }

  async create(dto: CreateRoleDto, actor: CurrentUserPayload) {
    const exists = await this.prisma.role.findFirst({
      where: { code: dto.code, tenantId: actor.tenantId },
    });
    if (exists) throw new BadRequestException('角色编码已存在');
    const role = await this.prisma.role.create({
      data: {
        code: dto.code,
        description: dto.description,
        isSystem: dto.isSystem ?? false,
        name: dto.name,
        sort: dto.sort ?? 0,
        tenantId: actor.tenantId,
      },
    });
    await this.auditLogs.record({
      action: 'create',
      actor,
      method: 'POST',
      module: 'roles',
      path: '/api/system/roles',
      requestBody: dto,
      targetId: role.id,
      targetType: 'Role',
    });
    return role;
  }

  async findOne(id: string, actor: CurrentUserPayload) {
    const role = await this.prisma.role.findFirst({
      where: { deletedAt: null, id, tenantId: actor.tenantId },
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async getMenus(id: string, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const rows = await this.prisma.roleMenu.findMany({
      where: { roleId: id },
      select: { menuId: true },
    });
    return rows.map((row) => row.menuId);
  }

  async list(
    query: Record<string, string | undefined>,
    actor: CurrentUserPayload,
  ) {
    const { page, pageSize, skip, take } = toPage(query);
    const where: Prisma.RoleWhereInput = {
      deletedAt: null,
      tenantId: actor.tenantId,
      ...(query.code
        ? { code: { contains: query.code, mode: 'insensitive' } }
        : {}),
      ...(query.name
        ? { name: { contains: query.name, mode: 'insensitive' } }
        : {}),
      ...(query.status
        ? { status: query.status as 'DISABLED' | 'ENABLED' }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        where,
      }),
      this.prisma.role.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async remove(id: string, actor: CurrentUserPayload) {
    const role = await this.findOne(id, actor);
    if (role.isSystem) throw new ForbiddenException('系统角色不可删除');
    const users = await this.prisma.userRole.count({ where: { roleId: id } });
    if (users > 0) throw new ForbiddenException('角色已绑定用户，不允许删除');
    await this.prisma.role.update({
      data: { deletedAt: new Date() },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'delete',
      actor,
      method: 'DELETE',
      module: 'roles',
      path: `/api/system/roles/${id}`,
      targetId: id,
      targetType: 'Role',
    });
    return { success: true };
  }

  async update(id: string, dto: UpdateRoleDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const role = await this.prisma.role.update({ data: dto, where: { id } });
    await this.auditLogs.record({
      action: 'update',
      actor,
      method: 'PATCH',
      module: 'roles',
      path: `/api/system/roles/${id}`,
      requestBody: dto,
      targetId: id,
      targetType: 'Role',
    });
    return role;
  }
}
