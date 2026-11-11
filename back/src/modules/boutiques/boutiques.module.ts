import { Module } from '@nestjs/common';
import { BoutiquesController } from './boutiques.controller';
import { BoutiquesService } from './boutiques.service';
import { ProduitsModule } from '../produits/produits.module';

@Module({
  controllers: [BoutiquesController],
  imports: [ProduitsModule],
  providers: [BoutiquesService],
  exports: [BoutiquesService],
})
export class BoutiquesModule {}
