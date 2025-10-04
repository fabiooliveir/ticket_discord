import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se usuário já existe
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username ou email já existe');
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Criar usuário
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'username',
        'email',
        'role',
        'isActive',
        'lastLogin',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: number): Promise<User> {
    console.log('🔍 UsersService.findOne called with id:', id, 'type:', typeof id);
    
    if (isNaN(id) || id <= 0) {
      console.error('❌ UsersService.findOne - ID inválido:', id, 'isNaN:', isNaN(id));
      throw new UnauthorizedException('ID de usuário inválido');
    }
    
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'role',
        'isActive',
        'lastLogin',
        'createdAt',
        'updatedAt',
      ],
    });

    console.log('✅ UsersService.findOne - Found user:', user);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Se está atualizando senha, fazer hash
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Verificar conflitos de username/email se estiver alterando
    if (updateUserDto.username || updateUserDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: [
          { username: updateUserDto.username },
          { email: updateUserDto.email },
        ],
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username ou email já existe');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.usersRepository.update(id, { lastLogin: new Date() });
  }

  async getMe(id: number): Promise<User> {
    try {
      console.log('🔍 UsersService.getMe called with id:', id, 'type:', typeof id);
      
      // Validar se o ID é um número válido
      if (isNaN(id) || id <= 0) {
        console.error('❌ UsersService.getMe - ID inválido:', id, 'isNaN:', isNaN(id));
        throw new UnauthorizedException('ID de usuário inválido');
      }
      
      console.log('🔍 UsersService.getMe - Querying database with id:', id);
      
      const user = await this.usersRepository.findOne({
        where: { id },
        select: [
          'id',
          'username',
          'email',
          'role',
          'isActive',
          'lastLogin',
          'createdAt',
          'updatedAt',
        ],
      });

      console.log('✅ UsersService.getMe - Found user:', user);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      console.error('❌ Error in UsersService.getMe:', error);
      throw error;
    }
  }

  async updateMe(id: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    console.log('🔍 UsersService.updateMe called with id:', id, 'type:', typeof id);
    const user = await this.findOne(id);

    // Verificar se email já existe (se estiver sendo alterado)
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Atualizar apenas os campos fornecidos
    const updateData: Partial<User> = {};
    if (updateProfileDto.email !== undefined) {
      updateData.email = updateProfileDto.email;
    }
    if (updateProfileDto.phone !== undefined) {
      updateData.phone = updateProfileDto.phone;
    }

    await this.usersRepository.update(id, updateData);
    return this.getMe(id);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    console.log('🔍 UsersService.changePassword called with id:', id, 'type:', typeof id);
    
    if (isNaN(id) || id <= 0) {
      console.error('❌ UsersService.changePassword - ID inválido:', id, 'isNaN:', isNaN(id));
      throw new UnauthorizedException('ID de usuário inválido');
    }
    
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    console.log('✅ UsersService.changePassword - Found user:', user);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await this.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new ConflictException('Senha atual incorreta');
    }

    // Hash da nova senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Atualizar senha
    await this.usersRepository.update(id, { password: hashedPassword });
  }
}
