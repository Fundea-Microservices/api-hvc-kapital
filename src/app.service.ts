import { Injectable } from '@nestjs/common';

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
      today: new Date().toISOString(),
      docs: '/v1/docs',
    };
  }
}
