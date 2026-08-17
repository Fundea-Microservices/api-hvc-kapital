import { Injectable } from '@nestjs/common';

// El proceso corre en UTC (TZ=UTC) porque la API y la base de datos guardan
// todo en UTC. Esta zona se usa solo para presentar fechas al usuario, nunca
// para calcular o persistir.
const ZONA_PRESENTACION = 'America/Guatemala';

/**
 * Devuelve la fecha en formato ISO 8601 pero expresada en la zona de
 * presentación, con su desfase explícito (p. ej. 2026-08-17T09:54:52-06:00)
 * en lugar del sufijo 'Z' que produce toISOString().
 */
function enZonaLocal(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_PRESENTACION,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // 'h23' y no hour12:false: este último puede devolver "24" a medianoche
    // en algunas implementaciones de ICU.
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  })
    .formatToParts(fecha)
    .reduce<Record<string, string>>(
      (acc, p) => ({ ...acc, [p.type]: p.value }),
      {},
    );

  // 'longOffset' entrega 'GMT-06:00'; ISO 8601 espera solo '-06:00'.
  const desfase = partes.timeZoneName.replace('GMT', '');

  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}${desfase}`;
}

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'API REST Base',
      version: '2025-01',
      lastUpdate: '2025-10-06',
      status: 'online',
      // environment: process.env.NODE_ENV || 'development',
      environment: 'development',
      today: enZonaLocal(new Date()),
      timezone: ZONA_PRESENTACION,
      docs: '/v1/docs',
    };
  }
}
