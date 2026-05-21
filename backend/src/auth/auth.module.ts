import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  controllers: [AuthController],
  exports: [AuthService],
  imports: [PassportModule, JwtModule.register({}), AuditLogsModule],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
