import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Query Conversations DTO
 * SPEC-MSG-001 Phase 2
 */
export class QueryConversationsDto {
  @ApiPropertyOptional({
    description: 'Filter by conversation status',
    enum: ['ACTIVE', 'ARCHIVED', 'AUTO_ARCHIVED'],
    default: 'ACTIVE'
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'ARCHIVED', 'AUTO_ARCHIVED'])
  status?: 'ACTIVE' | 'ARCHIVED' | 'AUTO_ARCHIVED';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
