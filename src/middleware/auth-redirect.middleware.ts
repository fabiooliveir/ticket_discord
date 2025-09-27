import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Verificar se é uma requisição do navegador (não API)
    const isBrowserRequest = req.headers.accept?.includes('text/html');
    const isApiRequest = req.path.startsWith('/api/') || req.headers['content-type']?.includes('application/json');
    
    // Se for requisição do navegador e não for API, adicionar header especial
    if (isBrowserRequest && !isApiRequest) {
      req.headers['x-browser-request'] = 'true';
    }
    
    next();
  }
}
