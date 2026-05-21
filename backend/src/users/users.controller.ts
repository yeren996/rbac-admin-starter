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
import {
  AssignRolesDto,
  CreateUserDto,
  ResetPasswordDto,
  StatusDto,
  UpdateUserDto,
} from './dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller('system/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post(':id/roles')
  @RequirePermissions('system:user:assign-role')
  assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.assignRoles(id, dto, user);
  }

  @Post()
  @RequirePermissions('system:user:create')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @RequirePermissions('system:user:list')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Get()
  @RequirePermissions('system:user:list')
  list(
    @Query() query: Record<string, string | undefined>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.list(query, user);
  }

  @Delete(':id')
  @RequirePermissions('system:user:delete')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user);
  }

  @Post(':id/reset-password')
  @RequirePermissions('system:user:reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.resetPassword(id, dto, user);
  }

  @Patch(':id/status')
  @RequirePermissions('system:user:update')
  status(
    @Param('id') id: string,
    @Body() dto: StatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.changeStatus(id, dto, user);
  }

  @Patch(':id')
  @RequirePermissions('system:user:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }
}
