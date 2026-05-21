import type { CurrentUserPayload } from '../common/types/current-user';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AssignMenusDto, CreateRoleDto, StatusDto, UpdateRoleDto } from './dto';
import { RolesService } from './roles.service';
@ApiBearerAuth()
@ApiTags('roles')
@Controller('system/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly service: RolesService) {}
  @Post(':id/menus') @RequirePermissions('system:role:assign-menu') assignMenus(
    @Param('id') id: string,
    @Body() d: AssignMenusDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.assignMenus(id, d, u);
  }
  @Post() @RequirePermissions('system:role:create') create(
    @Body() d: CreateRoleDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.create(d, u);
  }
  @Get(':id') @RequirePermissions('system:role:list') findOne(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findOne(id, u);
  }
  @Get(':id/menus') @RequirePermissions('system:role:assign-menu') getMenus(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.getMenus(id, u);
  }
  @Get() @RequirePermissions('system:role:list') list(
    @Query() q: Record<string, string | undefined>,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.list(q, u);
  }
  @Delete(':id') @RequirePermissions('system:role:delete') remove(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.remove(id, u);
  }
  @Patch(':id/status') @RequirePermissions('system:role:update') status(
    @Param('id') id: string,
    @Body() d: StatusDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.changeStatus(id, d, u);
  }
  @Patch(':id') @RequirePermissions('system:role:update') update(
    @Param('id') id: string,
    @Body() d: UpdateRoleDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.update(id, d, u);
  }
}
