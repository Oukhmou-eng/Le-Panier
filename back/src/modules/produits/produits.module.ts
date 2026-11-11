import { Module } from '@nestjs/common';
import { ProduitsController } from './produits.controller';
import { ProduitsService } from './produits.service';
import { ProduitsRankingService } from './produits-ranking.service';

@Module({
  controllers: [ProduitsController],
  providers: [ProduitsService, ProduitsRankingService],
  exports: [ProduitsService, ProduitsRankingService],
})
export class ProduitsModule {}
