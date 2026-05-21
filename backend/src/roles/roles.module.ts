import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
@Module({
  controllers: [RolesController],
  exports: [RolesService],
  imports: [AuditLogsModule],
  providers: [RolesService],
})
export class RolesModule {}
