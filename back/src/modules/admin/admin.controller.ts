import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() dto: CreateSignalementDto) {
    return this.adminService.create(dto);
  }

  @Get()
  findAll() {
    return this.adminService.findAll();
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('signalements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findSignalements() {
    return this.adminService.findAllSignalements();
  }

  @Patch('signalements/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateSignalementStatus(
    @Param('id') id: string,
    @Body('statut') statut: string,
    @CurrentUser() user: { id_user: number },
  ) {
    return this.adminService.updateSignalementStatus(+id, statut, user.id_user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSignalementDto>) {
    return this.adminService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
