import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSignalementDto {
  @IsNumber()
  id_user: number;

  @IsEnum(['produit', 'boutique', 'utilisateur', 'avis', 'message'] as const)
  type_cible: 'produit' | 'boutique' | 'utilisateur' | 'avis' | 'message';

  @IsNumber()
  id_cible: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  motif: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['ouvert', 'en_cours', 'resolu', 'rejete'] as const)
  statut?: 'ouvert' | 'en_cours' | 'resolu' | 'rejete';

  @IsOptional()
  @IsNumber()
  id_admin?: number;
}
