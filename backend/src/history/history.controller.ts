import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { HistoryService } from './history.service';
import { ResumeDto } from '../shared/resume.dto';

interface SaveDto { resume: ResumeDto; }

@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  list() {
    return this.history.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.history.get(id);
  }

  @Post()
  @HttpCode(201)
  save(@Body() dto: SaveDto) {
    return this.history.save(dto.resume);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.history.remove(id);
  }
}
