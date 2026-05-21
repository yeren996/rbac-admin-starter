import type { CurrentUserPayload } from '../common/types/current-user';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Menu } from '@prisma/client';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto, StatusDto, UpdateMenuDto } from './dto';

@Injectable()
export class MenusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async changeStatus(id: string, dto: StatusDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const menu = await this.prisma.menu.update({
      data: { status: dto.status },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'status',
      actor,
      method: 'PATCH',
      module: 'menus',
      path: `/api/system/menus/${id}/status`,
      requestBody: dto,
      targetId: id,
      targetType: 'Menu',
    });
    return menu;
  }

  async create(dto: CreateMenuDto, actor: CurrentUserPayload) {
    this.validate(dto);
    const menu = await this.prisma.menu.create({
      data: {
        ...dto,
        hidden: dto.hidden ?? false,
        keepAlive: dto.keepAlive ?? false,
        sort: dto.sort ?? 0,
        tenantId: actor.tenantId,
      },
    });
    await this.auditLogs.record({
      action: 'create',
      actor,
      method: 'POST',
      module: 'menus',
      path: '/api/system/menus',
      requestBody: dto,
      targetId: menu.id,
      targetType: 'Menu',
    });
    return menu;
  }

  async findOne(id: string, actor: CurrentUserPayload) {
    const menu = await this.prisma.menu.findFirst({
      where: { deletedAt: null, id, tenantId: actor.tenantId },
    });
    if (!menu) throw new NotFoundException('菜单不存在');
    return menu;
  }

  async list(actor: CurrentUserPayload) {
    return this.tree(actor);
  }

  async remove(id: string, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const children = await this.prisma.menu.count({
      where: { deletedAt: null, parentId: id },
    });
    if (children > 0) throw new ForbiddenException('存在子节点，不允许删除');
    await this.prisma.menu.update({
      data: { deletedAt: new Date() },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'delete',
      actor,
      method: 'DELETE',
      module: 'menus',
      path: `/api/system/menus/${id}`,
      targetId: id,
      targetType: 'Menu',
    });
    return { success: true };
  }

  async tree(actor: CurrentUserPayload) {
    const rows = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      where: { deletedAt: null, tenantId: actor.tenantId },
    });
    return buildTree(rows);
  }

  async update(id: string, dto: UpdateMenuDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    this.validate(dto);
    const menu = await this.prisma.menu.update({
      data: { ...dto },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'update',
      actor,
      method: 'PATCH',
      module: 'menus',
      path: `/api/system/menus/${id}`,
      requestBody: dto,
      targetId: id,
      targetType: 'Menu',
    });
    return menu;
  }

  private validate(dto: CreateMenuDto | UpdateMenuDto) {
    if (dto.type === 'BUTTON' && !dto.permission)
      throw new BadRequestException('按钮权限必须填写 permission');
  }
}

interface TreeMenu extends Menu {
  children?: TreeMenu[];
}
export function buildTree(rows: Menu[]): TreeMenu[] {
  const map = new Map<string, TreeMenu>();
  for (const row of rows) map.set(row.id, { ...row, children: [] });
  const roots: TreeMenu[] = [];
  for (const row of rows) {
    const node = map.get(row.id);
    if (!node) continue;
    const parent = row.parentId ? map.get(row.parentId) : undefined;
    if (parent) {
      parent.children ??= [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
