import { Module } from '@nestjs/common';

import { NotificationManagementController } from './notification-management.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, NotificationManagementController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
