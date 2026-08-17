import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
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
      'https://pasteleriasanmiguel.com'
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalFilters(new HttpCustomExceptionFilter());

  await app.listen(envs.port);

  logger.log(`API running on port ${envs.port}`);
}
bootstrap();
