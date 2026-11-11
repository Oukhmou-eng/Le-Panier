import { Controller, Get, Post, Body, Param, Patch, Delete, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';

@Controller('commandes')
@UseGuards(JwtAuthGuard)
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post()
  create(@CurrentUser() user: { id_user: number }, @Body() dto: CreateCommandeDto) {
    return this.commandesService.create(user.id_user, dto);
  }

  @Get()
  findAll() {
    return this.commandesService.findAll();
  }

  @Post('statistiques')
  getStatistics(
    @Body() body: { periode?: number },
    @CurrentUser() user: { id_user: number; id_boutique?: number },
  ) {
    return this.commandesService.getStatistics(user, body.periode ?? 7);
  }

  @Get('utilisateur/me')
  findByCurrentUser(@CurrentUser() user: { id_user: number }) {
    return this.commandesService.findByUser(user.id_user);
  }

  // Les routes statiques doivent être déclarées avant :userId, sinon « me »
  // est interprété comme un identifiant utilisateur.
  @Get('utilisateur/id/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.commandesService.findByUser(+userId);
  }

  @Get('utilisateur/me/debug')
  async debugCurrentUser(@CurrentUser() user: any) {
    const commandes = await this.commandesService.findByUser(user?.id_user ?? null);
    return { user, commandes };
  }

  @Get('boutique/:boutiqueId')
  findByBoutique(@Param('boutiqueId') boutiqueId: string, @Req() req: any) {
    return this.commandesService.findByBoutique(+boutiqueId, req.user?.id_user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commandesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id_user: number },
    @Body() dto: { statut?: string },
  ) {
    return this.commandesService.updateStatusForBoutique(+id, user.id_user, dto.statut);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commandesService.remove(+id);
  }
}
