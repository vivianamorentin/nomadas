import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { WorkAgreementController } from './work-agreement.controller';
import { WorkAgreementService } from './work-agreement.service';

/**
 * Application Workflow Context
 * SPEC-APP-001: Enhanced with work agreements and state machine
 */
@Module({
  controllers: [ApplicationsController, WorkAgreementController],
  providers: [ApplicationsService, WorkAgreementService],
  exports: [ApplicationsService, WorkAgreementService],
})
export class ApplicationsModule {}
