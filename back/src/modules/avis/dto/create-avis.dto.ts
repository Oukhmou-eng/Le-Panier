import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAvisDto {
  @IsEnum(['produit', 'boutique'])
  type_cible!: 'produit' | 'boutique';

  @IsInt()
  id_cible!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  note!: number;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
