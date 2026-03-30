import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PreviewMailService } from './preview-mail.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { ApiKeyGuard } from './security/api-key.guard';
import { RateLimiterGuard } from './security/rate-limiter.guard';

@Controller('previewmail/templates')
@UseGuards(RateLimiterGuard, ApiKeyGuard)
export class PreviewMailController {
  constructor(private readonly service: PreviewMailService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return this.service.findAll(p, l);
  }

  @Get(':alias')
  async findByAlias(@Param('alias') alias: string) {
    return this.service.findByAlias(alias);
  }

  @Post()
  async create(@Body() createDto: CreateTemplateDto) {
    return this.service.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTemplateDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true };
  }
}
