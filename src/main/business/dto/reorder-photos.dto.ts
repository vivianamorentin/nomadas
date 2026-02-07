import { IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderPhotosDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  photoIds: number[];
}
