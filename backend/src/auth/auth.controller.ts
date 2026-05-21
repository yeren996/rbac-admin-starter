import type { CurrentUserPayload } from '../common/types/current-user';

import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RefreshTokenDto } from './dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiBearerAuth()
  @Post('profile/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(user, dto);
  }

  @ApiBearerAuth()
  @Get('auth/codes')
  @UseGuards(JwtAuthGuard)
  codes(@CurrentUser() user: CurrentUserPayload) {
    return this.auth.getPermissions(user);
  }

  @Post('auth/login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return { success: true };
  }

  @ApiBearerAuth()
  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser() user: CurrentUserPayload,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.auth.me(user, acceptLanguage);
  }

  @ApiBearerAuth()
  @Get('menu/all')
  @UseGuards(JwtAuthGuard)
  menuAll(
    @CurrentUser() user: CurrentUserPayload,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.auth.getRouteMenus(user, acceptLanguage);
  }

  @ApiBearerAuth()
  @Get('auth/menus')
  @UseGuards(JwtAuthGuard)
  menus(
    @CurrentUser() user: CurrentUserPayload,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.auth.getRouteMenus(user, acceptLanguage);
  }

  @Post('auth/refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }

  @ApiBearerAuth()
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { avatar?: string; nickname?: string },
  ) {
    return this.auth.updateProfile(user, dto);
  }

  // Vben 兼容接口
  @ApiBearerAuth()
  @Get('user/info')
  @UseGuards(JwtAuthGuard)
  userInfo(@CurrentUser() user: CurrentUserPayload) {
    return this.auth.userInfo(user);
  }
}
