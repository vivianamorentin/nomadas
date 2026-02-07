import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Query Messages DTO
 * SPEC-MSG-001 Phase 2 - Cursor-based pagination
 */
export class QueryMessagesDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (message ID to start from)',
    example: 'clx1234567890'
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of messages to fetch',
    default: 50,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
