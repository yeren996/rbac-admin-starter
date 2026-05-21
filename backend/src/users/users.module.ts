import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [AuditLogsModule],
  providers: [UsersService],
})
export class UsersModule {}
