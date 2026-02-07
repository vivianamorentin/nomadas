import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateJobPostingDto } from './create-job-posting.dto';

export class UpdateJobPostingDto extends PartialType(
  OmitType(CreateJobPostingDto, [] as const)
) {}
