import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['apikey'];

    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }

    try {
      return true;
    } catch (error) {
      if (error.toString().includes('Empty response'))
        throw new UnauthorizedException(
          'Empty response from API key validation',
        );
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
