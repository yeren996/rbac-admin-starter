import type { CurrentUserPayload } from '../common/types/current-user';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AuditLogsService } from './audit-logs.service';

@ApiBearerAuth()
@ApiTags('audit-logs')
@Controller('system/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @RequirePermissions('system:audit:list')
  list(
    @Query() query: Record<string, string | undefined>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.list(query, user);
  }
}
