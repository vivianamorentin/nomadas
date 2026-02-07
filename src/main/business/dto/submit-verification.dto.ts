import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { VerificationDocumentType } from '@prisma/client';

export class SubmitVerificationDto {
  @IsEnum(VerificationDocumentType)
  @IsNotEmpty()
  documentType: VerificationDocumentType;

  @IsString()
  @IsNotEmpty()
  fileName: string;
}
