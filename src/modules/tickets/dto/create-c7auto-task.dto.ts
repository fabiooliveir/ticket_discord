import { IsString, MinLength } from 'class-validator';

export class CreateC7AutoTaskDto {
  @IsString()
  @MinLength(3, { message: 'O título deve ter pelo menos 3 caracteres' })
  title: string;

  @IsString()
  @MinLength(2, {
    message: 'O nome do cliente deve ter pelo menos 2 caracteres',
  })
  clientName: string;

  @IsString()
  @MinLength(5, { message: 'A descrição deve ter pelo menos 5 caracteres' })
  description: string;
}
