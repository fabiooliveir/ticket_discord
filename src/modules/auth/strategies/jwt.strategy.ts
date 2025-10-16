import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT Strategy - Payload recebido:', payload);
    console.log(
      '🔍 JWT Strategy - payload.sub:',
      payload.sub,
      'tipo:',
      typeof payload.sub,
    );

    // Validar se o ID é um número válido
    const userId = Number(payload.sub);
    console.log(
      '🔍 JWT Strategy - userId convertido:',
      userId,
      'tipo:',
      typeof userId,
    );

    if (isNaN(userId) || userId <= 0) {
      console.error(
        '❌ JWT Strategy - ID inválido:',
        payload.sub,
        'convertido para:',
        userId,
      );
      throw new UnauthorizedException('Token inválido: ID de usuário inválido');
    }

    const user = {
      userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
    };

    console.log('✅ JWT Strategy - Usuário validado:', user);
    return user;
  }
}
