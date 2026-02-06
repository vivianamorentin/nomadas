import { IsEnum, IsString, IsOptional, Length } from 'class-validator';

/**
 * Moderation Action Enum
 * Actions available to moderators for flagged reviews
 */
export enum ModerationAction {
  APPROVE = 'APPROVE',
  HIDE = 'HIDE',
  SUSPEND_USER = 'SUSPEND_USER',
}

/**
 * Moderate Review DTO
 * Admin action on a flagged review
 *
 * Validation Rules:
 * - action must be one of: APPROVE, HIDE, SUSPEND_USER
 * - reason is required for HIDE and SUSPEND_USER actions
 */
export class ModerateReviewDto {
  @IsEnum(ModerationAction, {
    message: 'Action must be one of: APPROVE, HIDE, SUSPEND_USER',
  })
  action: ModerationAction;

  @IsString()
  @IsOptional()
  @Length(0, 500, {
    message: 'Reason must not exceed 500 characters',
  })
  reason?: string;
}
