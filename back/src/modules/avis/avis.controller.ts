import { Controller, Get, Post, Body, Param, Patch, Delete,UseGuards } from '@nestjs/common';
import { AvisService } from './avis.service';
import { CreateAvisDto } from './dto/create-avis.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('avis')
export class AvisController {
  constructor(private readonly avisService: AvisService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() body: { type_cible: string; id_cible: number; note: number; commentaire: string },
    @CurrentUser() user: { id_user: number },
  ) {
    return this.avisService.create(
      body.type_cible,
      body.id_cible,
      body.note,
      body.commentaire,
      user.id_user,
    );
  }

  @Get()
  findAll() {
    return this.avisService.findAll();
  }
  
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.avisService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAvisDto>) {
    return this.avisService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.avisService.remove(+id);
  }
}
