import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service'; 
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private  db: DatabaseService,
    private  jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const users = await this.db.query(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email],
    ) as any[];

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
  async register(dto: RegisterDto) {
  const { nom, prenom, email, password,confirmPassword } = dto;

  const existingUsers = await this.db.query(
    'SELECT id_user FROM utilisateurs WHERE email = ?',
    [email],
  ) as any[];

  if (existingUsers.length > 0) {
    throw new ConflictException('Email déjà utilisé');
  }
  if(password != confirmPassword) {
    throw new ConflictException('mote de passe de confirmation et deffrence a mote de passe ');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await this.db.query(
    `INSERT INTO utilisateurs
    (nom, prenom, email, password, role, statut, date_creation)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      nom,
      prenom,
      email,
      hashedPassword,
      'user',
      'actif',
      new Date(),
    ],
  );

  return {
    message: 'Utilisateur créé avec succès',
    
  };
}

   async login(email: string, password: string) {

    const users = await this.db.query(
        "SELECT * FROM utilisateurs WHERE email=?",
        [email]
    ) as any[];

    if (users.length === 0) {
        throw new UnauthorizedException(
            "Email ou mot de passe incorrect"
        );
    }

    const user = users[0];

    const valid = await bcrypt.compare(
        password,
        user.password
    );

    if (!valid) {
        throw new UnauthorizedException(
            "Email ou mot de passe incorrect"
        );
    }

    const status = String(user.statut || user.status || '').toLowerCase();
    if (status === 'suspendu' || status === 'suspended') {
      throw new UnauthorizedException(
        'Compte suspendu. Vous ne pouvez pas vous connecter.'
      );
    }

    const [boutiqueInfo] = (await this.db.query<any[]>(
      'SELECT id_boutique FROM boutiques WHERE id_user = ? LIMIT 1',
      [user.id_user],
    )) ?? [];

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
