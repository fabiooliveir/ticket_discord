import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/auth.decorator';
import { UserRole, User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('setup-admin')
  async setupAdmin(@Body() createUserDto: CreateUserDto) {
    // Verificar se já existe algum usuário
    const existingUsers = await this.usersService.findAll();
    if (existingUsers.length > 0) {
      throw new HttpException(
        'Sistema já foi inicializado. Use o endpoint /users com autenticação.',
        HttpStatus.FORBIDDEN,
      );
    }

    // Criar usuário admin
    const adminUser = {
      ...createUserDto,
      role: UserRole.ADMIN,
    };

    return this.usersService.create(adminUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll() {
    return this.usersService.findAll();
  }

  // Endpoints para o próprio usuário (perfil) - DEVEM vir ANTES de /:id
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    console.log('getMe controller called with user:', user);
    console.log(
      'user.userId type:',
      typeof user?.userId,
      'value:',
      user?.userId,
    );

    if (!user || user.userId === null || user.userId === undefined) {
      console.error('❌ Invalid user object in getMe:', user);
      throw new HttpException('Usuário inválido', HttpStatus.UNAUTHORIZED);
    }

    return this.usersService.getMe(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    console.log('updateMe controller called with user:', user);
    console.log(
      'user.userId type:',
      typeof user?.userId,
      'value:',
      user?.userId,
    );

    if (!user || user.userId === null || user.userId === undefined) {
      console.error('❌ Invalid user object in updateMe:', user);
      throw new HttpException('Usuário inválido', HttpStatus.UNAUTHORIZED);
    }

    return this.usersService.updateMe(user.userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    console.log('changePassword controller called with user:', user);
    console.log(
      'user.userId type:',
      typeof user?.userId,
      'value:',
      user?.userId,
    );

    if (!user || user.userId === null || user.userId === undefined) {
      console.error('❌ Invalid user object in changePassword:', user);
      throw new HttpException('Usuário inválido', HttpStatus.UNAUTHORIZED);
    }

    return this.usersService.changePassword(user.userId, changePasswordDto);
  }

  // Endpoints para administração - DEVEM vir DEPOIS de /me
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findOne(@Param('id') id: string) {
    console.log(
      '🔍 UsersController.findOne called with id:',
      id,
      'type:',
      typeof id,
    );
    console.log(
      '🔍 UsersController.findOne - +id result:',
      +id,
      'type:',
      typeof +id,
    );
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
