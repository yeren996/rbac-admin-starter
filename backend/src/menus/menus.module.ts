import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
@Module({
  controllers: [MenusController],
  exports: [MenusService],
  imports: [AuditLogsModule],
  providers: [MenusService],
})
export class MenusModule {}
