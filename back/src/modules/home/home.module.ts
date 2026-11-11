import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { ProduitsModule } from '../produits/produits.module';

@Module({
  controllers: [HomeController],
  imports: [ProduitsModule],
  providers: [HomeService, OptionalJwtAuthGuard]
})
export class HomeModule {}
