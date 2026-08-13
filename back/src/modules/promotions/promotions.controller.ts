import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { CreatePlanTarifDto } from './dto/create-plan-tarif.dto';
import { UpdatePlanTarifDto } from './dto/update-plan-tarif.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: { id_user: number },
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.create(dto, user.id_user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/plans')
  adminFindPlans() {
    return this.promotionsService.adminFindPlans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/factures')
  adminFindFactures() {
    return this.promotionsService.adminFindFactures();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/plans')
  adminCreatePlan(
    @CurrentUser() user: { id_user: number },
    @Body() dto: CreatePlanTarifDto,
  ) {
    return this.promotionsService.createPlan(dto, user.id_user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/plans/:id')
  adminUpdatePlan(
    @CurrentUser() user: { id_user: number },
    @Param('id') id: string,
    @Body() dto: UpdatePlanTarifDto,
  ) {
    return this.promotionsService.updatePlan(+id, dto, user.id_user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/plans/:id/statut')
  adminUpdatePlanStatut(
    @CurrentUser() user: { id_user: number },
    @Param('id') id: string,
    @Body('statut') statut: string,
  ) {
    return this.promotionsService.updatePlanStatut(+id, statut, user.id_user);
  }

  @Get('plans')
  findPlans() {
    return this.promotionsService.findPlans();
  }

  @Get('active')
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get()
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromotionDto>) {
    return this.promotionsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(+id);
  }
}
