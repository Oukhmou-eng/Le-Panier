import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategorieDto {
  @IsString()
  @MaxLength(150)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icone?: string;

  @IsOptional()
  @IsIn(['actif', 'inactif'])
  statut?: 'actif' | 'inactif';

  @IsOptional()
  id_categorie_parent?: number | null;
}
