import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Conversation DTO
 * SPEC-MSG-001 Phase 2
 */
export class CreateConversationDto {
  @ApiProperty({ description: 'ID of the second participant (user2)' })
  @IsInt()
  user2Id: number;

  @ApiPropertyOptional({
    description: 'Optional: Link to job application (REQ-MSG-002)',
    example: 123
  })
  @IsOptional()
  @IsInt()
  jobApplicationId?: number;
}
