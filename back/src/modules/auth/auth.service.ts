import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private  jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.utilisateurs.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
  async register(dto: RegisterDto) {
  const { nom, prenom, email, password,confirmPassword } = dto;

  const existingUser = await this.prisma.utilisateurs.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictException('Email déjà utilisé');
  }
  if(password != confirmPassword) {
    throw new ConflictException('mote de passe de confirmation et deffrence a mote de passe ');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await this.prisma.utilisateurs.create({
    data: { nom, prenom, email, password: hashedPassword, role: 'user', statut: 'actif' },
  });

  return {
    message: 'Utilisateur créé avec succès',
    
  };
}

   async login(email: string, password: string) {

    const user = await this.prisma.utilisateurs.findUnique({ where: { email } });
    if (!user) {
        throw new UnauthorizedException(
            "Email ou mot de passe incorrect"
        );
    }

    const valid = await bcrypt.compare(
        password,
        user.password
    );

    if (!valid) {
        throw new UnauthorizedException(
            "Email ou mot de passe incorrect"
        );
    }

    const status = String(user.statut || '').toLowerCase();
    if (status === 'suspendu' || status === 'suspended') {
      throw new UnauthorizedException(
        'Compte suspendu. Vous ne pouvez pas vous connecter.'
      );
    }

    const boutiqueInfo = await this.prisma.boutiques.findFirst({
      where: { id_user: user.id_user },
      select: { id_boutique: true },
    });

    const token = this.jwtService.sign({
      sub: user.id_user,
      email: user.email,
      role: user.role,
      id_boutique: boutiqueInfo?.id_boutique ?? null,
    });

    return {
      token,
      id_boutique: boutiqueInfo?.id_boutique ?? null,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      avatar: user.logo_url,
      message: 'connexion bien realiser',
    };
  }
}
