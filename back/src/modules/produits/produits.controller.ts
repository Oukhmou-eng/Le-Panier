import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseInterceptors, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { ProduitsService } from './produits.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { CreateSoldeDto } from './dto/create-solde.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('produits')
export class ProduitsController {
  constructor(private readonly produitsService: ProduitsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('medias', 20, { limits: { fileSize: 5 * 1024 * 1024 } }))
  async create(
    @Body() dto: CreateProduitDto,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [],
    @CurrentUser() user?: any,
  ) {
    const medias = await Promise.all(files.map((file, ordre) => this.saveMedia(file, ordre)));
    const idUser = user?.id_user;
    return this.produitsService.create(dto, medias, idUser);
  }

  private async saveMedia(file: { buffer: Buffer; originalname: string; mimetype: string }, ordre: number) {
    const type: 'image' | 'video' | null = file.mimetype.startsWith('video/') ? 'video' : file.mimetype.startsWith('image/') ? 'image' : null;
    if (!type) throw new BadRequestException('Seuls les fichiers image et vidéo sont autorisés.');

    const extension = extname(file.originalname).toLowerCase() || (type === 'video' ? '.mp4' : '.jpg');
    const filename = `${type}-${randomUUID()}${extension}`;
    const directory = join(process.cwd(), 'uploads', 'produits');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), file.buffer);
    return { type, ordre, url: `http://localhost:${process.env.PORT || 3000}/uploads/produits/${filename}` };
  }

  @Get()
  findAll() {
    return this.produitsService.findAll();
  }

  @Get('similaires')
findSimilarProducts(
  @Query('shopId') shopId: string,
  @Query('id_categorie') idCategorie: string,
) {
  return this.produitsService.findSimilarProducts(
    Number(shopId),
    Number(idCategorie),
  );
}
  @UseGuards(JwtAuthGuard)
  @Get(':id/mes-produits')
  getMesProduits(@Param('id') id: string) {
    return this.produitsService.getMesProduits(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('signale')
  signaler(@Body() body: any, @CurrentUser() user: { id_user: number }) {
    return this.produitsService.signaler(body.id, body.motif, body.description, user.id_user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/signale')
  signalerParId(
    @Param('id') id: string,
    @Body('motif') motif: string,
    @Body('description') description: string,
    @CurrentUser() user: { id_user: number },
  ) {
    return this.produitsService.signaler(+id, motif, description, user.id_user);
  }

  @Get(':id/avis')
  getAvis(@Param('id') id: number) {
    return this.produitsService.getAvis(id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.produitsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/solde')
  createSolde(
    @Param('id') id: string,
    @Body() dto: CreateSoldeDto,
    @CurrentUser() user?: any,
  ) {
    return this.produitsService.createSolde(+id, dto, user?.id_user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('medias', 20, { limits: { fileSize: 5 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProduitDto>,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string; mimetype: string }> = [],
    @CurrentUser() user?: any,
  ) {
    const medias = await Promise.all(files.map((file, ordre) => this.saveMedia(file, ordre)));
    return this.produitsService.update(+id, dto, medias, user?.id_user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.produitsService.remove(+id);
  }
}
