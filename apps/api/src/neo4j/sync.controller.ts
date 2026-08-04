import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/guards/admin-api-key.guard';
import { SyncService } from './services/sync.service';

@ApiTags('Admin Neo4j')
@Controller('admin/neo4j')
@UseGuards(AdminApiKeyGuard)
@ApiBearerAuth()
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  async syncAll() {
    return this.syncService.syncAll();
  }
}
