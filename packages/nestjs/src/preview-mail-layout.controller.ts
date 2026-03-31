import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PreviewMailService } from './preview-mail.service';
import { CreateLayoutDto, UpdateLayoutDto } from './dto/layout.dto';
import { ApiKeyGuard } from './security/api-key.guard';
import { RateLimiterGuard } from './security/rate-limiter.guard';

@Controller('previewmail/layouts')
@UseGuards(RateLimiterGuard, ApiKeyGuard)
export class PreviewMailLayoutController {
  constructor(private readonly service: PreviewMailService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 50;
    return this.service.findAllLayouts(p, l);
  }

  @Get(':alias')
  async findByAlias(@Param('alias') alias: string) {
    return this.service.findLayoutByAlias(alias);
  }

  @Post()
  async create(@Body() createDto: CreateLayoutDto) {
    return this.service.createLayout(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateLayoutDto) {
    return this.service.updateLayout(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.deleteLayout(id);
    return { success: true };
  }
}
