import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProduitsModule } from '../produits/produits.module';

@Module({
  controllers: [CategoriesController],
  imports: [ProduitsModule],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
