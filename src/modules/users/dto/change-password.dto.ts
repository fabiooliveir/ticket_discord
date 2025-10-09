import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @IsString({ message: 'Nova senha é obrigatória' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, { 
    message: 'Nova senha deve conter pelo menos uma letra e um número' 
  })
  newPassword: string;
}










