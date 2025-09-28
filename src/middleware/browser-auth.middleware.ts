import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BrowserAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Verificar se é uma requisição do navegador
    const isBrowserRequest = req.headers.accept?.includes('text/html');
    const isApiRequest =
      req.path.startsWith('/api/') ||
      req.path.startsWith('/auth/') ||
      req.path.startsWith('/users/') ||
      req.path.startsWith('/tickets/') ||
      req.path.startsWith('/sla/') ||
      req.path.startsWith('/leadfy/');

    // Se for requisição do navegador para dashboard, redirecionar para login
    if (
      isBrowserRequest &&
      !isApiRequest &&
      req.path.startsWith('/dashboard/')
    ) {
      return res.redirect('/auth/login-page');
    }

    next();
  }
}
