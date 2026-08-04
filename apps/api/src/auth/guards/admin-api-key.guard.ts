import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_API_KEY;

    if (!expectedKey) {
      throw new UnauthorizedException('Admin API key not configured');
    }

    if (!apiKey || typeof apiKey !== 'string' || !expectedKey) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    const provided = Buffer.from(apiKey);
    const expected = Buffer.from(expectedKey);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }
}
