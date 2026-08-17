
import { envs } from 'src/config';
import { DataSource } from 'typeorm';
import type { Pool } from 'mysql2';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE_SQLSERVER',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: envs.dbServer,
        port: envs.dbPort,
        username: envs.dbUser,
        password: envs.dbPassword,
        database: envs.dbDatabase,
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: false,
        // 'Z': el driver lee/escribe los DATETIME como UTC puro, sin
        // convertir según la zona horaria del proceso Node ni la del
        // servidor MySQL. Necesario para que la hora de un registro no
        // cambie según en qué zona horaria corra la API (local vs. AWS).
        timezone: 'Z',
      });

      const initialized = await dataSource.initialize();

      // El 'timezone' de arriba solo controla cómo el driver convierte
      // Date <-> string en el cliente; las columnas TIMESTAMP las convierte
      // el propio servidor MySQL usando el time_zone de la sesión (por
      // defecto 'SYSTEM', es decir la zona del SO del servidor de base de
      // datos). Se fuerza aquí para que ni esas columnas ni CURRENT_TIMESTAMP/
      // NOW() dependan de esa configuración.
      const pool = (initialized.driver as unknown as { pool: Pool }).pool;
      pool.on('connection', (connection) => {
        connection.query("SET time_zone = '+00:00'");
      });

      return initialized;
    },
  },
];
