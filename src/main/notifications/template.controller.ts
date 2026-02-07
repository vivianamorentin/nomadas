import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { RolesGuard } from '../identity/guards/roles.guard';
import { Roles } from '../identity/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TemplateEngineService } from './services/template-engine.service';
import { PrismaService } from '../shared/infrastructure/database/prisma.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  RenderTemplateDto,
  QueryTemplatesDto,
} from './dto/template.dto';

/**
 * Template Controller
 * Admin endpoints for managing notification templates
 * SPEC-NOT-001 Phase 2
 */
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplateController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: TemplateEngineService,
  ) {}

  /**
   * List all templates (paginated)
   * Admin only
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: QueryTemplatesDto) {
    const { page = 1, limit = 20, type, language, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (language) where.language = language;
    if (isActive !== undefined) where.isActive = isActive;

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        orderBy: [
          { type: 'asc' },
          { language: 'asc' },
          { version: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data: templates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get template by key
   * Admin only
   */
  @Get(':key')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('key') key: string) {
    return this.prisma.notificationTemplate.findUnique({
      where: { key },
    });
  }

  /**
   * Create new template
   * Admin only
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateEngine.upsertTemplate(createTemplateDto);
  }

  /**
   * Update template
   * Admin only
   * Creates a new version when updating active template
   */
  @Put(':key')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('key') key: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    // Get existing template
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error('Template not found');
    }

    // If updating active template, create new version
    if (existing.isActive) {
      return this.templateEngine.upsertTemplate({
        type: existing.type as any,
        language: existing.language,
        ...updateTemplateDto,
      });
    } else {
      // Just update inactive template
      return this.prisma.notificationTemplate.update({
        where: { key },
        data: updateTemplateDto,
      });
    }
  }

  /**
   * Delete template
   * Admin only
   */
  @Delete(':key')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('key') key: string) {
    await this.prisma.notificationTemplate.delete({
      where: { key },
    });
  }

  /**
   * Rollback template to previous version
   * Admin only
   */
  @Post(':key/rollback')
  @Roles(UserRole.ADMIN)
  async rollback(@Param('key') key: string) {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return this.templateEngine.rollbackTemplate(template.id);
  }

  /**
   * Render template with variables (test endpoint)
   * Admin only
   */
  @Post('render')
  @Roles(UserRole.ADMIN)
  async render(@Body() renderTemplateDto: RenderTemplateDto) {
    return this.templateEngine.renderTemplate(
      renderTemplateDto.type,
      renderTemplateDto.language,
      renderTemplateDto.variables,
    );
  }

  /**
   * Get all templates for a specific type
   * Admin only
   */
  @Get('by-type/:type')
  @Roles(UserRole.ADMIN)
  async getByType(@Param('type') type: string) {
    return this.templateEngine.getTemplatesByType(type as any);
  }
}
