import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  deptId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  nickname!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @IsString()
  username!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  deptId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class StatusDto {
  @IsIn(['ENABLED', 'DISABLED'])
  status!: 'DISABLED' | 'ENABLED';
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  password!: string;
}

export class AssignRolesDto {
  @IsArray()
  roleIds!: string[];
}
