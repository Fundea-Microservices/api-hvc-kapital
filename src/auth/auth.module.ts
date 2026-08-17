import { Body, Module, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EntitiesProvider } from 'database/entities/entities.provider';
import { DatabaseModule } from 'database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { envs } from 'src/config';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { UsuariosService } from './usuarios/usuarios.service';
import { PuestosController } from './puestos/puestos.controller';
import { PuestosService } from './puestos/puestos.service';
import { ApiKeysController } from './api-keys/api-keys.controller';
import { ApiKeysService } from './api-keys/api-keys.service';
import { MenuController } from './menu/menu.controller';
import { MenuService } from './menu/menu.service';
import { AccesosController } from './accesos/accesos.controller';
import { AccesosService } from './accesos/accesos.service';
import { ConfigController } from './config/config.controller';
import { ConfigService } from './config/config.service';
import { SucursalController } from './sucursal/sucursal.controller';
import { SucursalService } from './sucursal/sucursal.service';
import { PermisosController } from './permisos/permisos.controller';
import { PermisoService } from './permisos/permiso.service';
import { PermisoRolService } from './permisos/permiso-rol.service';
import { PermisoUsuarioService } from './permisos/permiso-usuario.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true,
      secret: envs.jwtSecret,
      signOptions: { expiresIn: envs.tokenExpiration }, // Configura el tiempo de expiración del token
    }),
  ],
  controllers: [
    AuthController,
    RolesController,
    UsuariosController,
    PuestosController,
    ApiKeysController,
    MenuController,
    AccesosController,
    ConfigController,
    SucursalController,
    PermisosController
  ],
  providers: [
    ...EntitiesProvider,
    AuthService,
    RolesService,
    UsuariosService,
    PuestosService,
    ApiKeysService,
    MenuService,
    AccesosService,
    ConfigService,
    SucursalService,
    PermisoService,
    PermisoRolService,
    PermisoUsuarioService
  ],
  exports: [
    ...EntitiesProvider,
    JwtModule
  ]
})
export class AuthModule {}
