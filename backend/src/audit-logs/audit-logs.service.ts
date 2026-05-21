import type { CurrentUserPayload } from '../common/types/current-user';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { toPage } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditRecordInput {
  action: string;
  module: string;
  method: string;
  path: string;
  actor?: CurrentUserPayload | null;
  tenantId?: string;
  targetType?: string;
  targetId?: string;
  requestBody?: unknown;
  responseStatus?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: Record<string, string | undefined>,
    user: CurrentUserPayload,
  ) {
    const { page, pageSize, skip, take } = toPage(query);
    const where: Prisma.AuditLogWhereInput = {
      tenantId: user.tenantId,
      ...(query.actorUsername
        ? {
            actorUsername: {
              contains: query.actorUsername,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.module
        ? { module: { contains: query.module, mode: 'insensitive' } }
        : {}),
      ...(query.action
        ? { action: { contains: query.action, mode: 'insensitive' } }
        : {}),
      ...(query.method ? { method: query.method } : {}),
      ...(query.path
        ? { path: { contains: query.path, mode: 'insensitive' } }
        : {}),
      ...(query.startAt || query.endAt
        ? {
            createdAt: {
              ...(query.startAt ? { gte: new Date(query.startAt) } : {}),
              ...(query.endAt ? { lte: new Date(query.endAt) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        where,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async record(input: AuditRecordInput) {
    const tenantId = input.tenantId ?? input.actor?.tenantId;
    if (!tenantId) return null;
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorId: input.actor?.id,
        actorUsername: input.actor?.username,
        durationMs: input.durationMs,
        ip: input.ip,
        method: input.method,
        module: input.module,
        path: input.path,
        requestBody:
          input.requestBody === undefined
            ? undefined
            : (input.requestBody as Prisma.InputJsonValue),
        responseStatus: input.responseStatus,
        targetId: input.targetId,
        targetType: input.targetType,
        tenantId,
        userAgent: input.userAgent,
      },
    });
  }
}
