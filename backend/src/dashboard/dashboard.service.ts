import type { CurrentUserPayload } from '../common/types/current-user';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async overview(user: CurrentUserPayload) {
    const [userCount, roleCount, menuCount, recentLogs] = await Promise.all([
      this.prisma.user.count({
        where: { deletedAt: null, tenantId: user.tenantId },
      }),
      this.prisma.role.count({
        where: { deletedAt: null, tenantId: user.tenantId },
      }),
      this.prisma.menu.count({
        where: { deletedAt: null, tenantId: user.tenantId },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        where: { tenantId: user.tenantId },
      }),
    ]);
    return { menuCount, recentLogs, roleCount, userCount };
  }
}
