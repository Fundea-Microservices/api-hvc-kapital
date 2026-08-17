import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';
import { GetUser, Public } from 'src/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async loginUser(@Body() loginUserDto: LoginDto) {
    return await this.authService.login(loginUserDto);
  }

  @Public()
  @Post('verify-token')
  async verifyToken(@Body('token') token: string) {
    return await this.authService.verifyToken(token);
  }

  @Get('me')
  async getCurrentUser(@GetUser() user: any) {
    return {
      success: true,
      statusCode: '200',
      path: 'auth/me',
      timestamp: new Date()
        .toLocaleString('es-GT', {
          timeZone: 'America/Guatemala',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .replace(/\//g, '/')
        .replace(',', ''),
      message: 'Usuario obtenido correctamente',
      data: user,
      metadata: null,
    };
  }
}
