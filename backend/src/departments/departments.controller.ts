import type { CurrentUserPayload } from '../common/types/current-user';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, StatusDto, UpdateDepartmentDto } from './dto';
@ApiBearerAuth()
@ApiTags('departments')
@Controller('system/departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}
  @Post() @RequirePermissions('system:department:create') create(
    @Body() d: CreateDepartmentDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.create(d, u);
  }
  @Get('tree') @RequirePermissions('system:department:list') fetchTree(
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.tree(u);
  }
  @Get(':id') @RequirePermissions('system:department:list') findOne(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findOne(id, u);
  }
  @Get() @RequirePermissions('system:department:list') list(
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.list(u);
  }
  @Delete(':id') @RequirePermissions('system:department:delete') remove(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.remove(id, u);
  }
  @Patch(':id/status') @RequirePermissions('system:department:update') status(
    @Param('id') id: string,
    @Body() d: StatusDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.changeStatus(id, d, u);
  }
  @Patch(':id') @RequirePermissions('system:department:update') update(
    @Param('id') id: string,
    @Body() d: UpdateDepartmentDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.update(id, d, u);
  }
}
