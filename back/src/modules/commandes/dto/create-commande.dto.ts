import { Type } from 'class-transformer';
import {
  IsIn,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class AdresseCommandeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'L’adresse de livraison est requise.' })
  ligne1: string;

  @IsString()
  @IsNotEmpty()
  ville: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9 -]{3,20}$/, { message: 'Code postal invalide.' })
  code_postal: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[+0-9 ()-]{8,25}$/, { message: 'Numéro de téléphone invalide.' })
  tele: string;

  @IsOptional()
  @IsString()
  libelle?: string;
}

export class CarteSimuleeDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/(\d{2})$/, { message: 'Date d’expiration invalide (MM/AA).' })
  expiration: string;

  @IsString()
  @Matches(/^\d{3,4}$/, { message: 'CVC invalide.' })
  cvc: string;
}

export class PaiementCommandeDto {
  @IsIn(['carte', 'cod'])
  methode: 'carte' | 'cod';

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @ValidateIf((value) => value.methode === 'carte')
  @IsDefined({ message: 'Les informations de carte sont requises.' })
  @ValidateNested()
  @Type(() => CarteSimuleeDto)
  carte?: CarteSimuleeDto;
}

export class CreateCommandeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_adresse?: number;

  @ValidateIf((value) => !value.id_adresse)
  @IsDefined({ message: 'L’adresse de livraison est requise.' })
  @ValidateNested()
  @Type(() => AdresseCommandeDto)
  adresse?: AdresseCommandeDto;

  @IsDefined({ message: 'Le moyen de paiement est requis.' })
  @ValidateNested()
  @Type(() => PaiementCommandeDto)
  paiement: PaiementCommandeDto;
}
