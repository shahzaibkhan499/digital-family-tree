import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';
import { GenealogyCalculatorService } from './genealogy-calculator.service';

@Module({
  controllers: [TreeController],
  providers: [TreeService, GenealogyCalculatorService],
  exports: [TreeService, GenealogyCalculatorService],
})
export class TreeModule {}
