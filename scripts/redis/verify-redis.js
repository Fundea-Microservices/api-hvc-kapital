#!/usr/bin/env node
/**
 * Verificador del Redis que usa la idempotencia.
 *
 * Comprueba, contra el servidor real, lo que la librería
 * @nestjs-redisx/idempotency necesita: conexión, escritura con TTL, scripting
 * (EVALSHA) y una política de memoria que no borre registros por su cuenta.
 *
 * Uso:
 *   node scripts/redis/verify-redis.js [--env-file .env]
 *
 * Variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB.
 * Sale con 0 si todo está correcto (puede haber advertencias) y 1 si hay un
 * fallo que impide usar la idempotencia con garantías.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const envFile =
  process.argv.find((arg) => arg.startsWith('--env-file='))?.split('=')[1] ||
  (() => {
    const i = process.argv.indexOf('--env-file');
    return i >= 0 ? process.argv[i + 1] : undefined;
  })() ||
  path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile, quiet: true });
}

const Redis = require('ioredis');

const host = process.env.REDIS_HOST || '127.0.0.1';
const port = Number(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;
const db = Number(process.env.REDIS_DB || 0);
const esLocal = ['127.0.0.1', 'localhost', '::1'].includes(host);

const color = process.stdout.isTTY
  ? {
      ok: '\x1b[32m',
      warn: '\x1b[33m',
      fail: '\x1b[31m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
    }
  : { ok: '', warn: '', fail: '', reset: '', bold: '' };

let fallos = 0;
let advertencias = 0;

function resultado(estado, nombre, detalle) {
  if (estado === 'fail') fallos += 1;
  if (estado === 'warn') advertencias += 1;
  const etiqueta =
    estado === 'ok'
      ? `${color.ok}OK${color.reset}`
      : estado === 'warn'
        ? `${color.warn}AVISO${color.reset}`
        : `${color.fail}FALLO${color.reset}`;
  console.log(`  [${etiqueta}] ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

async function main() {
  console.log(
    `${color.bold}Verificación de Redis para idempotencia${color.reset}`,
  );
  console.log(`  Servidor: ${host}:${port} (db ${db})\n`);

  const client = new Redis({
    host,
    port,
    password,
    db,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    // Un job de verificación no debe quedarse reintentando eternamente.
    retryStrategy: () => null,
  });
  client.on('error', () => {
    /* El error se reporta abajo; silenciar el log por defecto de ioredis. */
  });

  try {
    const inicio = process.hrtime.bigint();
    await client.connect();
    const pong = await client.ping();
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;

    resultado(
      pong === 'PONG' ? 'ok' : 'fail',
      'Conexión y PING',
      `${pong} en ${ms.toFixed(1)} ms`,
    );

    // Versión
    const info = await client.info('server');
    const version = /redis_version:([^\r\n]+)/.exec(info)?.[1] ?? 'desconocida';
    const mayor = Number(version.split('.')[0]);
    if (mayor < 5) {
      resultado('fail', 'Versión de Redis', `${version} (se requiere ≥ 5)`);
    } else if (mayor < 7) {
      resultado('warn', 'Versión de Redis', `${version} (recomendado ≥ 7)`);
    } else {
      resultado('ok', 'Versión de Redis', version);
    }

    // Escritura + TTL + borrado: es exactamente lo que hace el store.
    const clave = `idempotency:healthcheck:${Date.now()}`;
    const set = await client.set(clave, 'ok', 'EX', 10, 'NX');
    const valor = await client.get(clave);
    const ttl = await client.ttl(clave);
    const borrado = await client.del(clave);
    resultado(
      set === 'OK' && valor === 'ok' && ttl > 0 && borrado === 1
        ? 'ok'
        : 'fail',
      'Escritura, lectura y TTL',
      `SET=${set}, TTL=${ttl}s, DEL=${borrado}`,
    );

    // Scripting: el store carga Lua con SCRIPT LOAD y lo invoca con EVALSHA.
    try {
      const sha = await client.script('LOAD', 'return 1');
      const evaluado = await client.evalsha(sha, 0);
      resultado(
        Number(evaluado) === 1 ? 'ok' : 'fail',
        'Scripting (Lua / EVALSHA)',
        Number(evaluado) === 1 ? 'disponible' : `resultado ${evaluado}`,
      );
    } catch (error) {
      resultado(
        'fail',
        'Scripting (Lua / EVALSHA)',
        `no disponible: ${error.message}. La idempotencia atómica no puede funcionar.`,
      );
    }

    // Política de memoria: si Redis puede desalojar llaves, se pierden
    // registros y reaparecen los duplicados.
    try {
      const [, policy] = await client.config('GET', 'maxmemory-policy');
      if (policy === 'noeviction') {
        resultado('ok', 'maxmemory-policy', policy);
      } else if (policy && policy.startsWith('allkeys-')) {
        resultado(
          'fail',
          'maxmemory-policy',
          `${policy}: puede desalojar llaves de idempotencia. Usar noeviction.`,
        );
      } else {
        resultado(
          'warn',
          'maxmemory-policy',
          `${policy}: puede desalojar llaves con TTL bajo presión de memoria. Recomendado: noeviction.`,
        );
      }
    } catch (error) {
      resultado(
        'warn',
        'maxmemory-policy',
        `no se pudo consultar (¿CONFIG deshabilitado?): ${error.message}`,
      );
    }

    // Persistencia: sin AOF, un reinicio pierde los registros vigentes.
    try {
      const [, appendonly] = await client.config('GET', 'appendonly');
      resultado(
        appendonly === 'yes' ? 'ok' : 'warn',
        'appendonly',
        appendonly === 'yes'
          ? 'yes'
          : 'no: un reinicio de Redis pierde los registros de idempotencia',
      );
    } catch (error) {
      resultado(
        'warn',
        'appendonly',
        `no se pudo consultar: ${error.message}`,
      );
    }

    // maxmemory: si está puesto, el margen debe ser suficiente.
    try {
      const [, maxmemory] = await client.config('GET', 'maxmemory');
      const bytes = Number(maxmemory);
      if (bytes === 0) {
        resultado('ok', 'maxmemory', 'sin límite (Redis usa toda la RAM disponible)');
      } else {
        resultado(
          'warn',
          'maxmemory',
          `${(bytes / 1024 / 1024).toFixed(0)} MB: con noeviction, al llenarse fallarán las escrituras.`,
        );
      }
    } catch {
      /* opcional */
    }

    // Seguridad: un Redis accesible desde red sin contraseña es un riesgo.
    if (!esLocal) {
      try {
        const [, requirepass] = await client.config('GET', 'requirepass');
        if (!password || !requirepass) {
          resultado(
            'fail',
            'Seguridad',
            'Redis no es local y no tiene contraseña configurada.',
          );
        } else {
          resultado('ok', 'Seguridad', 'contraseña configurada');
        }
      } catch {
        resultado(
          'warn',
          'Seguridad',
          'no se pudo verificar requirepass (CONFIG deshabilitado).',
        );
      }
    } else {
      resultado('ok', 'Seguridad', 'conexión local');
    }
  } catch (error) {
    resultado('fail', 'Conexión', error.message);
    console.error(
      `\nNo se pudo conectar a ${host}:${port}. Comprueba que Redis esté instalado y activo:\n` +
        '  sudo bash scripts/redis/install-redis.sh\n' +
        '  bash scripts/redis/verify-redis.sh\n',
    );
  } finally {
    client.disconnect();
  }

  console.log(
    `\n${color.bold}Resumen:${color.reset} ${fallos} fallo(s), ${advertencias} advertencia(s).`,
  );
  process.exitCode = fallos > 0 ? 1 : 0;
}

void main();
