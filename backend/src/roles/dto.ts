import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  @IsString() code!: string;
  @IsOptional() @IsString() description?: string;
  @IsBoolean() @IsOptional() isSystem?: boolean;
  @IsString() name!: string;
  @IsInt() @IsOptional() sort?: number;
}
export class UpdateRoleDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() name?: string;
  @IsInt() @IsOptional() sort?: number;
}
export class StatusDto {
  @IsIn(['ENABLED', 'DISABLED']) status!: 'DISABLED' | 'ENABLED';
}
export class AssignMenusDto {
  @IsArray() menuIds!: string[];
}
