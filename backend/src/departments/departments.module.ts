import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
@Module({
  controllers: [DepartmentsController],
  exports: [DepartmentsService],
  imports: [AuditLogsModule],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
