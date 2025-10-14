import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(100, { message: 'Email deve ter no máximo 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, { 
    message: 'Telefone deve estar no formato E.164 (ex: +5511999999999)' 
  })
  phone?: string;
}













