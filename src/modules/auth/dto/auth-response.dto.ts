import { UserRole } from '../../users/entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    lastLogin: Date;
  };
}
