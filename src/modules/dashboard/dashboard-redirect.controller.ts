import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('dashboard')
export class DashboardRedirectController {
  @Get('overview')
  redirectToLogin(@Res() res: Response) {
    return res.redirect('/auth/login-page');
  }
}
