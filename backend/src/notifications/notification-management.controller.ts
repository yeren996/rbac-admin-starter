import type { CurrentUserPayload } from '../common/types/current-user';

import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('notification-management')
@Controller('system/notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationManagementController {
  constructor(private readonly service: NotificationsService) {}

  @Delete()
  @RequirePermissions('system:notification:delete')
  clear(@CurrentUser() user: CurrentUserPayload) {
    return this.service.clear(user);
  }

  @Get(':id')
  @RequirePermissions('system:notification:list')
  detail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.service.detail(user, id, acceptLanguage);
  }

  /**
   * 后台通知管理列表。
   * 仅面向拥有 system:notification:* 权限的管理员，额外提供分页、关键字、来源和已读状态筛选。
   */
  @Get()
  @RequirePermissions('system:notification:list')
  list(
    @Query() query: Record<string, string | undefined>,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.service.page(query, user, acceptLanguage);
  }

  /** “全部已读”是批量状态变更，独立权限便于后续按角色细分。 */
  @Patch('read-all')
  @RequirePermissions('system:notification:update')
  markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.service.markAllRead(user);
  }

  @Patch(':id/read')
  @RequirePermissions('system:notification:update')
  markRead(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.markRead(user, id);
  }

  @Delete(':id')
  @RequirePermissions('system:notification:delete')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }
}
