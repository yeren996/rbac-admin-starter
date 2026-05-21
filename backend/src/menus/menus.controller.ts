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
import { CreateMenuDto, StatusDto, UpdateMenuDto } from './dto';
import { MenusService } from './menus.service';
@ApiBearerAuth()
@ApiTags('menus')
@Controller('system/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusController {
  constructor(private readonly service: MenusService) {}
  @Post() @RequirePermissions('system:menu:create') create(
    @Body() d: CreateMenuDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.create(d, u);
  }
  @Get('tree') @RequirePermissions('system:menu:list') fetchTree(
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.tree(u);
  }
  @Get(':id') @RequirePermissions('system:menu:list') findOne(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findOne(id, u);
  }
  @Get() @RequirePermissions('system:menu:list') list(
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.list(u);
  }
  @Delete(':id') @RequirePermissions('system:menu:delete') remove(
    @Param('id') id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.remove(id, u);
  }
  @Patch(':id/status') @RequirePermissions('system:menu:update') status(
    @Param('id') id: string,
    @Body() d: StatusDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.changeStatus(id, d, u);
  }
  @Patch(':id') @RequirePermissions('system:menu:update') update(
    @Param('id') id: string,
    @Body() d: UpdateMenuDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.update(id, d, u);
  }
}
