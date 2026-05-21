import type { CurrentUserPayload } from '../common/types/current-user';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department } from '@prisma/client';

import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto, StatusDto, UpdateDepartmentDto } from './dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}
  async changeStatus(id: string, dto: StatusDto, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const dept = await this.prisma.department.update({
      data: { status: dto.status },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'status',
      actor,
      method: 'PATCH',
      module: 'departments',
      path: `/api/system/departments/${id}/status`,
      requestBody: dto,
      targetId: id,
      targetType: 'Department',
    });
    return dept;
  }
  async create(dto: CreateDepartmentDto, actor: CurrentUserPayload) {
    const exists = await this.prisma.department.findFirst({
      where: { code: dto.code, tenantId: actor.tenantId },
    });
    if (exists) throw new BadRequestException('部门编码已存在');
    const dept = await this.prisma.department.create({
      data: { ...dto, sort: dto.sort ?? 0, tenantId: actor.tenantId },
    });
    await this.auditLogs.record({
      action: 'create',
      actor,
      method: 'POST',
      module: 'departments',
      path: '/api/system/departments',
      requestBody: dto,
      targetId: dept.id,
      targetType: 'Department',
    });
    return dept;
  }
  async findOne(id: string, actor: CurrentUserPayload) {
    const dept = await this.prisma.department.findFirst({
      where: { deletedAt: null, id, tenantId: actor.tenantId },
    });
    if (!dept) throw new NotFoundException('部门不存在');
    return dept;
  }
  async list(actor: CurrentUserPayload) {
    return this.tree(actor);
  }
  async remove(id: string, actor: CurrentUserPayload) {
    await this.findOne(id, actor);
    const [children, users] = await Promise.all([
      this.prisma.department.count({
        where: { deletedAt: null, parentId: id },
      }),
      this.prisma.user.count({ where: { deletedAt: null, deptId: id } }),
    ]);
    if (children > 0) throw new ForbiddenException('存在子部门，不允许删除');
    if (users > 0) throw new ForbiddenException('部门已绑定用户，不允许删除');
    await this.prisma.department.update({
      data: { deletedAt: new Date() },
      where: { id },
    });
    await this.auditLogs.record({
      action: 'delete',
      actor,
      method: 'DELETE',
      module: 'departments',
      path: `/api/system/departments/${id}`,
      targetId: id,
      targetType: 'Department',
    });
    return { success: true };
  }
  async tree(actor: CurrentUserPayload) {
    const rows = await this.prisma.department.findMany({
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
      where: { deletedAt: null, tenantId: actor.tenantId },
    });
    return buildDepartmentTree(rows);
  }
  async update(
    id: string,
    dto: UpdateDepartmentDto,
    actor: CurrentUserPayload,
  ) {
    await this.findOne(id, actor);
    const dept = await this.prisma.department.update({
      data: dto,
      where: { id },
    });
    await this.auditLogs.record({
      action: 'update',
      actor,
      method: 'PATCH',
      module: 'departments',
      path: `/api/system/departments/${id}`,
      requestBody: dto,
      targetId: id,
      targetType: 'Department',
    });
    return dept;
  }
}
interface DeptTree extends Department {
  children?: DeptTree[];
}
export function buildDepartmentTree(rows: Department[]): DeptTree[] {
  const map = new Map<string, DeptTree>();
  rows.forEach((row) => map.set(row.id, { ...row, children: [] }));
  const roots: DeptTree[] = [];
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
