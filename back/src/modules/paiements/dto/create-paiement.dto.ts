import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaiementDto {
  @IsInt()
  id_commande!: number;

  @IsOptional()
  @IsInt()
  id_moyen_paiement?: number;

  @IsNumber()
  @Min(0)
  montant!: number;

  @IsString()
  methode!: string;

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @IsOptional()
  @IsString()
  reference_transaction?: string;
}
