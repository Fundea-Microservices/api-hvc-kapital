
import { envs } from 'src/config';
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE_SQLSERVER',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: envs.dbType,
        host: envs.dbServer,
        port: envs.dbPort,
        username: envs.dbUser,
        password: envs.dbPassword,
        database: envs.dbDatabase,
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: false,
        options: {
          // El driver lee y escribe los DATETIME como UTC puro, sin convertir
          // según la zona horaria del proceso Node ni la del servidor SQL
          // Server. Necesario para que la hora de un registro no cambie según
          // en qué zona horaria corra la API (local vs. AWS). Es el
          // equivalente en tedious al timezone:'Z' de otros drivers; viene
          // activo por defecto, pero se deja explícito porque es un requisito
          // del sistema, no una preferencia.
          useUTC: true,
          // La instancia usa un certificado autofirmado, así que se confía en
          // él en lugar de validarlo contra una CA (equivale al -C de sqlcmd).
          // Al desplegar contra un servidor con certificado emitido por una CA
          // reconocida, esto debe pasar a false.
          trustServerCertificate: true,
        },
      });

      return await dataSource.initialize();
    },
  },
];
