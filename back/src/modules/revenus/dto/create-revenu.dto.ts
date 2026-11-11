import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateRevenuDto {
  @IsInt()
  id_boutique!: number;

  @IsInt()
  id_commande_ligne!: number;

  @IsNumber()
  @Min(0)
  montant_brut!: number;

  @IsNumber()
  @Min(0)
  commission!: number;

  @IsNumber()
  @Min(0)
  montant_net!: number;
}
