import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsOptional() @IsString() component?: string;
  @IsOptional() @IsString() externalLink?: string;
  @IsBoolean() @IsOptional() hidden?: boolean;
  @IsOptional() @IsString() icon?: string;
  @IsBoolean() @IsOptional() keepAlive?: boolean;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() path?: string;
  @IsOptional() @IsString() permission?: string;
  @IsOptional() @IsString() redirect?: string;
  @IsInt() @IsOptional() sort?: number;
  @IsString() title!: string;
  @IsIn(['DIRECTORY', 'MENU', 'BUTTON']) type!: 'BUTTON' | 'DIRECTORY' | 'MENU';
}
export class UpdateMenuDto extends CreateMenuDto {}
export class StatusDto {
  @IsIn(['ENABLED', 'DISABLED']) status!: 'DISABLED' | 'ENABLED';
}
