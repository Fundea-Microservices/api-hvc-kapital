import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { envs } from './config';
import { HttpCustomExceptionFilter } from './common';
import {AuthorizationContextInterceptor} from './common/pipes/authorization-context.interceptor';
import { TimezoneSerializerInterceptor } from './common/interceptors/timezone-serializer.interceptor';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const logger = new Logger('API');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new WinstonLoggerService(),
  });
  app.setGlobalPrefix(envs.prefix);

  // Mitigación de CVE-2026-111181 (body-parser <= 2.3.0, sin versión 2.x
  // corregida publicada aún): un cuerpo comprimido malformado puede tumbar el
  // proceso. Ningún cliente nuestro envía cuerpos con Content-Encoding, así que
  // se desactiva la descompresión (esas peticiones reciben 415). Revertir a los
  // parsers por defecto cuando express use body-parser >= 2.4.0.
  app.useBodyParser('json', { inflate: false });
  app.useBodyParser('urlencoded', { extended: true, inflate: false });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:4200',
      'http://localhost',
      'http://172.25.5.11:8008',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalFilters(new HttpCustomExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API HVC Kapital')
    .setDescription(
      'API REST de autenticación, permisos y catálogos de HVC Kapital. ' +
        'Todas las rutas requieren un token JWT salvo las marcadas como públicas: ' +
        'obtén uno en POST /auth/login y regístralo con el botón Authorize.',
    )
    .setVersion(envs.prefix)
    // 'jwt' es el nombre del esquema; debe coincidir con el que reciben los
    // @ApiBearerAuth('jwt') de los controladores.
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwt',
    )
    // Respuestas que puede devolver cualquier ruta; se declaran una sola vez
    // aquí en lugar de repetirlas con @ApiResponse en cada endpoint.
    .addGlobalResponse(
      { status: 401, description: 'Token ausente, inválido o expirado.' },
      { status: 403, description: 'El usuario no tiene permiso para esta operación.' },
      { status: 500, description: 'Error interno del servidor.' },
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    // Respeta el prefijo global, así la ruta queda en /v1/docs.
    useGlobalPrefix: true,
    customSiteTitle: 'API HVC Kapital · Documentación',
    swaggerOptions: {
      // Conserva el token entre recargas de la página, para no tener que
      // volver a pegarlo en cada prueba.
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new TimezoneSerializerInterceptor(),
    new ClassSerializerInterceptor(reflector),
    new AuthorizationContextInterceptor(reflector),
  );
  
  await app.listen(envs.port);

  logger.log(`API running on port ${envs.port}`);
  logger.log(`Docs disponibles en /${envs.prefix}/docs`);
}
bootstrap();
