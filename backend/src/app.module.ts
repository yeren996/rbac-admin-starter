import { Module } from '@nestjs/common';

import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MenusModule } from './menus/menus.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    DashboardModule,
    NotificationsModule,
    ProfileModule,
  ],
})
export class AppModule {}
