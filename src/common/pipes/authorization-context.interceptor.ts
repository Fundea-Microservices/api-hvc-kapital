import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ExecutionContextCls } from './../validators/execution-context'; // Ajusta tu ruta
import { PERMISSIONS_KEY } from './../decorators/permissions.decorator'; // Ajusta tu ruta

@Injectable()
export class AuthorizationContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. Extraer el código del permiso exigido en el Controlador
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const permisoCodigo = requiredPermissions && requiredPermissions.length > 0 
      ? requiredPermissions[0] 
      : undefined;

    // 2. Envolver el resto del ciclo de vida (Pipes y Servicios) en el contexto
    return new Observable((subscriber) => {
      ExecutionContextCls.run(
        { isAuthorizedExecution: false, permisoCodigo }, 
        () => {
          next.handle().subscribe(subscriber);
        }
      );
    });
  }
}