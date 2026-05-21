import type { CurrentUserPayload } from '../common/types/current-user';

import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Delete()
  clear(@CurrentUser() user: CurrentUserPayload) {
    return this.service.clear(user);
  }

  /** 顶部栏铃铛使用的通知列表，只返回当前登录用户可见的数据。 */
  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.service.list(user, acceptLanguage);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: CurrentUserPayload) {
    return this.service.markAllRead(user);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.markRead(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.service.remove(user, id);
  }

  /** 未读数单独提供，方便后续接入轮询、WebSocket 或 Server-Sent Events。 */
  @Get('unread-count')
  unreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.service.unreadCount(user);
  }

  /** 通知详情供顶部栏点击单条消息时使用，避免只能跳转而看不到完整内容。 */
  @Get(':id')
  viewDetail(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.service.detail(user, id, acceptLanguage);
  }
}
