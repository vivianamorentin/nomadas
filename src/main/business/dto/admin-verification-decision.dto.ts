import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class AdminVerificationDecisionDto {
  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  decision: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
