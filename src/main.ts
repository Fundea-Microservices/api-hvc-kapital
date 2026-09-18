import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { envs } from './config';
import { HttpCustomExceptionFilter } from './common';

async function bootstrap() {
  const logger = new Logger('API');

  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLoggerService(),
  });
  app.setGlobalPrefix(envs.prefix);

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

  await app.listen(envs.port);

  logger.log(`API running on port ${envs.port}`);
  logger.log(`Docs disponibles en /${envs.prefix}/docs`);
}
bootstrap();
