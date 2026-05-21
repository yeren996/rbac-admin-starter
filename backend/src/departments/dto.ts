import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
export class CreateDepartmentDto {
  @IsString() code!: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() leader?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsInt() @IsOptional() sort?: number;
}
export class UpdateDepartmentDto {
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() leader?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() phone?: string;
  @IsInt() @IsOptional() sort?: number;
}
export class StatusDto {
  @IsIn(['ENABLED', 'DISABLED']) status!: 'DISABLED' | 'ENABLED';
}
