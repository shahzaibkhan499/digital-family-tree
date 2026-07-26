import { Module } from '@nestjs/common';
import { TreeModule } from '../tree/tree.module';
import { GenealogyController } from '../tree/genealogy.controller';

@Module({
  imports: [TreeModule],
  controllers: [GenealogyController],
})
export class GenealogyModule {}
