import { Module } from '@nestjs/common';

import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  controllers: [AuditLogsController],
  exports: [AuditLogsService],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
