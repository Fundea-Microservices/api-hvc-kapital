# 🏗️ Estructura del Backend — Guía para Desarrolladores

> **Guía para principiantes:** Este documento explica qué contiene cada carpeta y archivo de la aplicación, para qué sirven y cómo se conectan entre sí. Está escrito de forma simple, como si estuvieras explorando el proyecto por primera vez.

---

## 📌 Índice

1. [Vista general del proyecto](#1--vista-general-del-proyecto)
2. [Archivos de la raíz del proyecto](#2--archivos-de-la-raíz-del-proyecto)
3. [`src/` — El corazón de la aplicación](#3--src--el-corazón-de-la-aplicación)
4. [`src/config/` — Variables de entorno](#4--srcconfig--variables-de-entorno)
5. [`src/common/` — Componentes reutilizables](#5--srccommon--componentes-reutilizables)
6. [`src/auth/` — Módulo de autenticación y autorización](#6--srcauth--módulo-de-autenticación-y-autorización)
7. [`src/storage/` — Módulo de almacenamiento de archivos](#7--srcstorage--módulo-de-almacenamiento-de-archivos)
8. [`src/logger/` — Sistema de logging](#8--srclogger--sistema-de-logging)
9. [`database/` — Capa de datos](#9--database--capa-de-datos)
10. [`test/` — Pruebas](#10--test--pruebas)
11. [Otros archivos y carpetas](#11--otros-archivos-y-carpetas)
12. [Cómo se conectan los módulos entre sí](#12--cómo-se-conectan-los-módulos-entre-sí)
13. [Resumen visual de la arquitectura](#13--resumen-visual-de-la-arquitectura)

---

## 1. 🌐 Vista general del proyecto

Este es un **backend API REST** construido con **NestJS** (framework de Node.js) que usa:

| Tecnología | Para qué se usa | Analogía |
|---|---|---|
| **NestJS** | Framework principal del backend | El esqueleto del edificio |
| **TypeScript** | Lenguaje de programación | El idioma en que está escrito el código |
| **TypeORM** | Conexión a la base de datos | El traductor entre código y SQL |
| **SQL Server** | Base de datos | El almacén donde se guardan los datos |
| **JWT** | Autenticación con tokens | La credencial del empleado |
| **Swagger** | Documentación de la API | El manual de instrucciones |
| **Winston** | Logging (registro de eventos) | La cámara de seguridad |
| **bcrypt** | Cifrado de contraseñas | La caja fuerte para contraseñas |
| **exceljs** | Exportación a Excel | El asistente que genera reportes |
| **class-validator** | Validación de datos | El inspector que revisa formularios |

### Estructura de carpetas (resumen)

```
api-gc/
├── src/                    ← Todo el código fuente
│   ├── config/             ← Variables de entorno
│   ├── common/             ← Herramientas compartidas
│   ├── auth/               ← Autenticación, usuarios, permisos
│   ├── storage/            ← Archivos y uploads
│   └── logger/             ← Sistema de logs
├── database/               ← Entidades y scripts SQL
├── test/                   ← Pruebas
├── docs/                   ← Documentación
├── uploads/                ← Archivos subidos por usuarios
├── logs/                   ← Archivos de log diarios
├── dist/                   ← Código compilado (build)
└── [archivos de config]    ← package.json, tsconfig, etc.
```

---

## 2. 📄 Archivos de la raíz del proyecto

Estos archivos configuran cómo se compila, ejecuta y forma el proyecto:

| Archivo | Qué es | Para qué sirve |
|---|---|---|
| `package.json` | Manifiesto del proyecto | Lista las dependencias (paquetes instalados) y los comandos (`npm run start:dev`, etc.) |
| `tsconfig.json` | Configuración de TypeScript | Define cómo se compila el código TS a JS |
| `tsconfig.build.json` | Configuración de build | Configuración extra para cuando se compila para producción |
| `nest-cli.json` | Configuración de NestJS CLI | Indica dónde está el código fuente (`src/`) y que se limpie el build anterior |
| `.env` | Variables de entorno | Contraseñas, puertos, secretos — **NUNCA se sube a git** |
| `.env.example` | Ejemplo de variables | Plantilla para que otros desarrolladores sepan qué variables configurar |
| `.prettierrc` | Configuración de formato | Define cómo se formatea el código (espacios, comillas, etc.) |
| `eslint.config.mjs` | Configuración de linting | Reglas para detectar errores y malas prácticas en el código |
| `ecosystem.config.js` | Configuración de PM2 | Configuración para desplegar en producción con PM2 (gestor de procesos) |
| `.gitignore` | Archivos ignorados por git | Dice qué NO subir al repositorio (node_modules, .env, dist, etc.) |

### Comandos importantes (de `package.json`)

```bash
npm run start:dev      # Iniciar en modo desarrollo (se reinicia solo al guardar cambios)
npm run start:debug    # Iniciar con depurador (para pausar y inspeccionar código)
npm run build          # Compilar para producción
npm run start:prod     # Ejecutar la versión compilada
npm run test           # Ejecutar pruebas unitarias
npm run test:e2e       # Ejecutar pruebas de extremo a extremo
npm run lint           # Revisar el código en busca de errores de estilo
npm run format         # Formatear el código automáticamente
```

---

## 3. 📁 `src/` — El corazón de la aplicación

```
src/
├── main.ts              ← Punto de entrada: arranca el servidor
├── app.module.ts        ← Módulo raíz: conecta todo
├── app.controller.ts    ← Ruta raíz: health check
├── app.service.ts       ← Lógica del health check
├── config/              ← Variables de entorno
├── common/              ← Herramientas compartidas entre módulos
├── auth/                ← Autenticación, usuarios, roles, permisos
├── storage/             ← Almacenamiento y descarga de archivos
└── logger/              ← Sistema de logging con Winston
```

### `main.ts` — El punto de entrada

Este es el archivo que **arranca todo**. Cuando ejecutas `npm run start:dev`, NestJS ejecuta este archivo. Hace lo siguiente:

```typescript
async function bootstrap() {
  // 1. Crear la aplicación NestJS
  const app = await NestFactory.create(AppModule);

  // 2. Definir el prefijo global de todas las rutas (/v1)
  app.setGlobalPrefix(envs.prefix);

  // 3. Configurar validación automática de datos de entrada
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // 4. Configurar CORS (quién puede conectarse desde el navegador)
  app.enableCors({ origin: ['http://localhost:8081', ...] });

  // 5. Configurar manejo global de errores
  app.useGlobalFilters(new HttpCustomExceptionFilter());

  // 6. Configurar Swagger (documentación)
  SwaggerModule.setup('docs', app, document);

  // 7. Iniciar el servidor
  await app.listen(envs.port);
}
```

### `app.module.ts` — El módulo raíz

El módulo raíz es el **director general** que conecta todos los módulos y registra los guards globales:

```typescript
@Module({
  imports: [
    ThrottlerModule,    // Rate limiting (límite de peticiones)
    AuthModule,         // Módulo de autenticación
    StorageModule,      // Módulo de archivos
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },        // Guard global #1
    { provide: APP_GUARD, useClass: PermissionsGuard },  // Guard global #2
    { provide: APP_GUARD, useClass: ThrottlerGuard },    // Guard global #3
  ],
})
```

> **¿Qué es un `APP_GUARD`?** Es una forma de decirle a NestJS: "este guard se aplica a TODAS las rutas, no solo a una". Los guards se ejecutan en el orden en que se registran.

### `app.controller.ts` — Ruta raíz

```typescript
@Public()        // ← No necesita token JWT
@Get()           // ← Responde a GET /
getHello() {     // ← Retorna estado de la API
  return { name: 'API REST Base', status: 'online', ... };
}
```

Este endpoint es un **health check**: sirve para verificar que la API está funcionando.

---

## 4. 📁 `src/config/` — Variables de entorno

```
src/config/
├── envs.ts    ← Define y valida las variables de entorno
└── index.ts   ← Exporta todo para que otros archivos lo importen
```

### `envs.ts` — El configuration manager

Este archivo se encarga de **leer y validar** las variables de entorno (las que están en `.env`):

```typescript
// Define qué variables son obligatorias
const envsSchema = joi.object({
  PORT: joi.number().required(),
  DB_HOST: joi.string().required(),
  DB_PORT: joi.number().required(),
  DB_USER: joi.string().required(),
  DB_PASSWORD: joi.string().allow('').required(),
  DB_DATABASE: joi.string().required(),
  DB_TYPE: joi.string().valid('mssql').required(),  // Solo SQL Server
  JWT_SECRET: joi.string().required(),
  TOKEN_EXPIRATION: joi.number().required(),
  PREFIX: joi.string().required(),
});

// Si falta alguna variable, la app NO arranca (falla con error claro)
```

**¿Por qué es importante?** Porque si alguien olvida configurar una variable en `.env`, la app falla al iniciar con un mensaje claro en lugar de fallar en运行 tiempo con errores raros.

### Variables de entorno disponibles

| Variable | Tipo | Descripción |
|---|---|---|
| `PORT` | número | Puerto donde escucha el servidor (ej: 3000) |
| `DB_HOST` | string | Dirección del servidor de base de datos |
| `DB_PORT` | número | Puerto de la base de datos (1433 para SQL Server) |
| `DB_USER` | string | Usuario de la base de datos |
| `DB_PASSWORD` | string | Contraseña de la base de datos |
| `DB_DATABASE` | string | Nombre de la base de datos |
| `DB_TYPE` | string | Tipo de BD (solo `mssql` está soportado) |
| `JWT_SECRET` | string | Secreto para firmar tokens JWT |
| `TOKEN_EXPIRATION` | número | Tiempo de vida del token en segundos |
| `PREFIX` | string | Prefijo de todas las rutas (ej: `v1`) |

---

## 5. 📁 `src/common/` — Componentes reutilizables

```
src/common/
├── index.ts                    ← Exporta todo lo reutilizable
├── services/
│   ├── base.service.ts         ← Clase base para todos los services
│   └── index.ts
├── decorators/
│   ├── admin.decorator.ts      ← @AdminOnly()
│   ├── public.decorator.ts     ← @Public()
│   ├── permissions.decorator.ts← @RequirePermissions()
│   └── get-user.decorator.ts   ← @GetUser()
├── guards/
│   ├── auth.guard.ts           ← Verifica token JWT
│   ├── permissions.guard.ts    ← Verifica permisos
│   ├── admin-only.guard.ts     ← Verifica rol admin
│   └── api-key.guard.ts        ← Verifica API key
├── dto/
│   ├── pagination.dto.ts       ← Paginación base
│   ├── pagination-user.dto.ts  ← Paginación de usuarios
│   ├── pagination-cuenta.dto.ts← Paginación de cuentas
│   ├── pagination-active.dto.ts← Paginación con filtro activo
│   ├── dpi.dto.ts              ← Validación de DPI guatemalteco
│   └── all-items.dto.ts        ← Filtros de items
├── transformers/
│   └── boolean.transformer.ts  ← Convierte strings a boolean
└── exceptions/
    └── http-custom-exception.filter.ts ← Manejo global de errores
```

### `services/base.service.ts` — La clase padre de todos los services

Todos los services de la aplicación **extienden** esta clase. Proporciona dos métodos fundamentales:

```typescript
// Para errores: lanza una excepción con formato estándar
this.customThrowError(error, 'BIT-01', 'Error al crear registro');
// → Lanza: { statusCode: 400, message: '(BIT-01) Error al crear registro', success: false }

// Para éxitos: retorna respuesta con formato estándar
this.customSuccessResponse(data, metadata, 201, 'Creado exitosamente', 'auth/bitacora');
// → Retorna: { success: true, statusCode: '201', data: ..., message: '...', timestamp: '...' }
```

**¿Por qué existe?** Para que TODAS las respuestas de la API tengan el **mismo formato**. El cliente siempre recibe:

```json
{
  "success": true/false,
  "statusCode": "200",
  "path": "auth/bitacora",
  "timestamp": "26/08/2026 10:30:00",
  "message": "Operación exitosa",
  "data": { ... },
  "metadata": { "total": 45, "page": 2, "limit": 10 }
}
```

### `decorators/` — Los decoradores personalizados

| Decorador | Archivo | Qué hace | Ejemplo de uso |
|---|---|---|---|
| `@Public()` | `public.decorator.ts` | Marca una ruta como pública (sin token) | `@Public() @Get('login')` |
| `@AdminOnly()` | `admin.decorator.ts` | Restringe a administradores | `@AdminOnly() @Delete(':id')` |
| `@RequirePermissions()` | `permissions.decorator.ts` | Requiere permisos específicos | `@RequirePermissions('USR01')` |
| `@GetUser()` | `get-user.decorator.ts` | Extrae el usuario del request | `@GetUser() user: Usuario` |

**¿Cómo funcionan internamente?** Todos usan `SetMetadata()` de NestJS. Esto guarda información en los "metadatos" del método, y los guards la leen después con `Reflector`.

```typescript
// Ejemplo simplificado de cómo funciona @AdminOnly:
export const AdminOnly = () => SetMetadata('isAdmin', true);
//                    ↑ Etiqueta          ↑ Dato guardado

// El AdminOnlyGuard lee ese dato:
const isAdminRequired = this.reflector.getAllAndOverride('isAdmin', [...]);
// Si es true, verifica que el usuario sea admin
```

### `guards/` — Los guardias de seguridad

| Guard | Qué verifica | Cuándo se ejecuta |
|---|---|---|
| `AuthGuard` | Token JWT válido y usuario activo | **Global** — en todas las rutas |
| `PermissionsGuard` | Permisos del usuario (rol o excepción) | **Global** — en todas las rutas |
| `AdminOnlyGuard` | Que el usuario sea administrador | **Solo** en rutas con `@AdminOnly()` |
| `ApiKeyGuard` | Header `apikey` válido | **Solo** en rutas con `@UseGuards(ApiKeyGuard)` |

> Los guards globales se registran en `app.module.ts` con `APP_GUARD`. Los individuales se aplican con `@UseGuards()` directamente en el controller o método.

### `dto/` — Objetos de Transferencia de Datos

Los DTOs definen **qué datos acepta** cada endpoint. Son como formularios:

```typescript
// Ejemplo: PaginationDto
{
  page: number = 1,        // Página (default 1)
  limit: number = 10,      // Registros por página (default 10)
  busqueda?: string,       // Texto de búsqueda libre
  todos?: boolean,         // ¿Traer todos sin paginación?
}
```

Los DTOs de paginación tienen una **herencia**:

```
PaginationDto (base)
├── PaginationUserDto (agrega: activo, principal, rolId, metodoId, puestoId)
├── PaginationCuentaDto (agrega: empresaId, bancoId)
└── PaginationActiveDto (agrega: activo, principal)
```

### `transformers/boolean.transformer.ts`

Convierte strings a boolean de forma inteligente:

```
"true", "1", "yes", "si", "sí"  → true
"false", "0", "no", "n"          → false
```

**¿Para qué?** Porque los query params siempre llegan como strings (`?todos=true`). Este transformador los convierte a boolean antes de llegar al service.

### `exceptions/http-custom-exception.filter.ts`

Este es el **filtro global de errores**. Captura CUALQUIER excepción y la formatea de forma consistente:

```
Error HTTP (throw new HttpException) → Retorna el status y mensaje original
Error de JavaScript (throw new Error) → Retorna 500 "Error interno" (oculta detalles)
Error personalizado (throw { statusCode, message }) → Retorna el statusCode y mensaje
```

**¿Por qué es importante?** Porque sin esto, si un error inesperado ocurre, el cliente recibiría un HTML de error feo en lugar de JSON.

---

## 6. 📁 `src/auth/` — Módulo de autenticación y autorización

Este es el módulo **más grande** del proyecto. Contiene toda la lógica de usuarios, roles, permisos y más.

```
src/auth/
├── auth.module.ts              ← Módulo principal: conecta todo
├── auth.controller.ts          ← Login, verify-token, me
├── auth.service.ts             ← Lógica de login y JWT
├── dto/
│   ├── login.dto.ts            ← Datos para login (userName, password)
│   ├── create-user.dto.ts      ← Datos para crear usuario
│   └── index.ts
├── usuarios/                   ← CRUD de usuarios
│   ├── usuarios.controller.ts
│   ├── usuarios.service.ts
│   └── dto/
├── roles/                      ← CRUD de roles
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   └── dto/
├── puestos/                    ← CRUD de puestos
│   ├── puestos.controller.ts
│   ├── puestos.service.ts
│   └── dto/
├── permisos/                   ← Sistema de permisos
│   ├── permisos.controller.ts
│   ├── permiso.service.ts      ← CRUD de permisos
│   ├── permiso-rol.service.ts  ← Permisos asignados a roles
│   ├── permiso-usuario.service.ts ← Permisos individuales por usuario
│   └── dto/
├── bitacora/                   ← Registro de autorizaciones
│   ├── bitacora.controller.ts
│   ├── bitacora.service.ts
│   └── dto/
├── accesos/                    ← Control de accesos
│   ├── accesos.controller.ts
│   ├── accesos.service.ts
│   └── dto/
├── api-keys/                   ← Gestión de API keys
│   ├── api-keys.controller.ts
│   ├── api-keys.service.ts
│   └── dto/
├── menu/                       ← Gestión de menús
│   ├── menu.controller.ts
│   ├── menu.service.ts
│   └── dto/
├── config/                     ← Configuración del módulo auth
│   ├── config.controller.ts
│   ├── config.service.ts
│   └── dto/
└── sucursal/                   ← Gestión de sucursales
    ├── sucursal.controller.ts
    ├── sucursal.service.ts
    └── dto/
```

### `auth.module.ts` — El módulo padre

Este archivo **conecta todos los sub-módulos** y configura JWT:

```typescript
@Module({
  imports: [
    DatabaseModule,                    // Acceso a la base de datos
    JwtModule.register({               // Configuración de JWT
      global: true,                    // Disponible en toda la app
      secret: envs.jwtSecret,          // Secreto para firmar tokens
      signOptions: { expiresIn: envs.tokenExpiration },
    }),
  ],
  controllers: [
    AuthController,          // Login, verify-token, me
    RolesController,         // CRUD roles
    UsuariosController,      // CRUD usuarios
    PuestosController,       // CRUD puestos
    PermisosController,      // CRUD permisos
    BitacoraController,      // Bitácora de autorización
    AccesosController,       // Control de accesos
    ApiKeysController,       // API keys
    MenuController,          // Menús
    ConfigController,        // Configuración
    SucursalController,      // Sucursales
  ],
  providers: [
    AuthService,
    RolesService,
    UsuariosService,
    // ... todos los services
  ],
})
```

### `auth.controller.ts` — Los endpoints de autenticación

| Endpoint | Método | ¿Público? | Descripción |
|---|---|---|---|
| `/auth/login` | POST | ✅ Sí (`@Public()`) | Iniciar sesión, retorna token JWT |
| `/auth/verify-token` | POST | ✅ Sí (`@Public()`) | Verificar si un token es válido |
| `/auth/me` | GET | ❌ No | Obtener datos del usuario autenticado |

### `auth.service.ts` — La lógica de login

El flujo del login:

```
1. Recibe userName y password
2. Busca el usuario en la BD (con su rol y sucursal)
3. Verifica que exista y esté activo
4. Compara la contraseña con bcrypt (comparación segura)
5. Si todo OK: genera un token JWT con los datos del usuario
6. Retorna { user, token }
```

**¿Qué contiene el token JWT?**

```json
{
  "userId": "uuid-del-usuario",
  "userName": "sysadmin",
  "rolId": "uuid-del-rol",
  "email": "admin@empresa.com",
  "fullName": "Administrador General",
  "iat": 1693084800,
  "exp": 1693171200
}
```

### Sub-módulos de `auth/`

| Sub-módulo | Qué gestiona | Ejemplo de uso |
|---|---|---|
| `usuarios/` | Crear, leer, actualizar, eliminar usuarios | Crear un nuevo empleado en el sistema |
| `roles/` | Gestión de roles (Admin, Gerente, etc.) | Asignar el rol "Gerente" a un usuario |
| `puestos/` | Puestos de trabajo | Registrar el puesto "Desarrollador" |
| `permisos/` | Sistema de permisos granular | Otorgar permiso "CREAR_USUARIO" a un rol |
| `bitacora/` | Registro de solicitudes de autorización | Registrar que Juan pidió permiso a María |
| `accesos/` | Control de accesos | Gestionar quién puede acceder a qué |
| `api-keys/` | Claves de API para servicios externos | Generar una clave para una app móvil |
| `menu/` | Menús de navegación | Configurar qué opciones ve cada rol |
| `config/` | Configuración del módulo | Ajustes generales de autenticación |
| `sucursal/` | Sucursales de la empresa | Registrar la sucursal "Oficina Central" |

### El sistema de permisos (3 tablas)

El sistema de permisos tiene **3 niveles** de control:

```
Permiso (tabla principal)
│   Código: "USR01", "USR02", etc.
│   Nombre: "Crear usuario"
│   requires_auth: false (¿necesita aprobación?)
│
├── Permiso_Rol (permisos heredados por el rol)
│   │   Si el rol "Gerente" tiene el permiso "USR01",
│   │   TODOS los gerentes pueden usar ese permiso.
│   │
│   └── autoriza: true/false (¿este permiso requiere aprobación para este rol?)
│
└── Permiso_Usuario (excepciones individuales)
    │   Si el usuario "Juan" tiene una excepción para "USR01",
    │   se evalúa ANTES que el permiso del rol.
    │
    └── autoriza: true/false
    └── permitido: true/false (permite o niega explícitamente)
```

**Jerarquía de decisión:**

```
1. ¿El usuario es admin? → Acceso total, no se verifica nada más
2. ¿Tiene excepción individual? (Permiso_Usuario) → Eso decide
3. ¿Su rol tiene el permiso? (Permiso_Rol) → Eso decide
4. Si nada de lo anterior → Acceso denegado
```

---

## 7. 📁 `src/storage/` — Módulo de almacenamiento de archivos

```
src/storage/
├── storage.module.ts                    ← Módulo: configura Multer y dependencias
├── export.service.ts                    ← Exportación a CSV y Excel
├── controllers/
│   └── storage.controller.ts            ← Endpoints de upload y download
├── services/
│   ├── storage.service.ts               ← Lógica principal de archivos
│   ├── file-validation.service.ts       ← Validación de tipos y extensiones
│   ├── antivirus.service.ts             ← Escaneo antivirus (placeholder)
│   └── entity-updater.service.ts        ← Actualiza entidades con URL del archivo
├── guards/
│   └── category-access.guard.ts         ← Control de acceso por categoría
├── interceptors/
│   └── file-logging.interceptor.ts      ← Log de operaciones de archivos
├── config/
│   └── category.config.ts               ← Configuración por categoría
├── dto/
│   ├── upload-file.dto.ts               ← Datos para subir archivo
│   └── index.ts
├── validators/
│   ├── magic-number.validator.ts        ← Valida magic numbers de archivos
│   └── path-security.validator.ts       ← Prevención de path traversal
├── utils/
│   └── filename-sanitizer.ts            ← Limpieza de nombres de archivo
└── perfil/                              ← Imágenes de perfil por defecto
    ├── sysadmin.png
    └── sysadmin.jpg
```

### `storage.controller.ts` — Endpoints de archivos

| Endpoint | Método | Descripción |
|---|---|---|
| `POST /storage/upload/:categoria` | POST | Subir archivo a una categoría |
| `GET /storage/:categoria/:fileName` | GET | Descargar un archivo |

### `category.config.ts` — Configuración por categoría

Cada categoría tiene reglas diferentes:

| Categoría | Tamaño máx. | Tipos permitidos | ¿Admin? | Antivirus |
|---|---|---|---|---|
| `perfil` | 5 MB | PNG, JPEG | No | No |
| `producto` | 10 MB | PNG, JPEG, WebP | **Sí** | No |
| `porcion` | 15 MB | PNG, JPEG, WebP | No | No |
| `solicitud` | 20 MB | PDF, PNG, JPEG | No | No |
| `documento` | 50 MB | PDF, DOC, DOCX | **Sí** | No |

### Flujo de subida de un archivo

```
1. Cliente envía POST /storage/upload/perfil con un archivo
2. CategoryAccessGuard verifica que el usuario tenga acceso
3. FileValidationService valida:
   a. Tipo MIME (¿es realmente una imagen?)
   b. Extensión (¿termina en .png/.jpg?)
   c. Magic numbers (¿los bytes del archivo coinciden con su tipo?)
4. AntivirusService escanea (placeholder, no hace nada aún)
5. FilenameSanitizer limpia el nombre (sin caracteres raros)
6. Se copia el archivo a uploads/perfil/
7. EntityUpdaterService actualiza el campo fotoUrl del usuario
8. Retorna la URL pública del archivo
```

### `validators/` — Seguridad de archivos

**`path-security.validator.ts`** — Previene ataques de path traversal:

```
Un atacante podría intentar enviar: ../../etc/passwd
Este validador detecta y bloquea:
  - .. (subir de directorio)
  - %2e%2e (versión URL-encoded)
  - bytes nulos (\0)
  - caracteres ilegales Windows (<>:"|?*)
  - rutas absolutas (/)
  - slashes múltiples (//)
```

**`magic-number.validator.ts`** — Verifica el contenido real del archivo:

```
Un atacante podría renombrar un virus.exe a foto.jpg
Los magic numbers son los primeros bytes del archivo:
  PNG:  89 50 4E 47 0D 0A 1A 0A
  JPEG: FF D8 FF E0/E1/E2/E8
  PDF:  25 50 44 46
  WebP: 52 49 46 46

Si el header no coincide con el MIME type → ERROR
```

### `file-logging.interceptor.ts` — Logger de archivos

Este interceptor **registra cada operación** de archivo:

```json
{
  "operation": "UPLOAD",
  "categoria": "perfil",
  "fileName": "foto-juan.jpg",
  "fileSize": 1048576,
  "userId": "uuid-usuario",
  "duration": "45ms",
  "success": true
}
```

---

## 8. 📁 `src/logger/` — Sistema de logging

```
src/logger/
└── winston-logger.service.ts    ← Logger con rotación de archivos
```

### `winston-logger.service.ts`

Usa **Winston** para guardar logs en archivos con rotación diaria:

```
logs/
├── logs-api-2026-08-26.txt    ← Log del día de hoy
├── logs-api-2026-08-25.txt    ← Log de ayer
├── logs-api-2026-08-24.txt    ← Log de antier
└── ... (se eliminan después de 90 días)
```

**Configuración:**
- **Ubicación:** carpeta `logs/`
- **Formato:** `logs-api-YYYY-MM-DD.txt`
- **Tamaño máximo por archivo:** 10 MB
- **Retención:** 90 días (archivos comprimidos en .gz)
- **Nivel de log:** `info` (guarda info, warn y error)

> **Nota:** Actualmente el logger de Winston está **comentado** en `main.ts`. La app usa el logger por defecto de NestJS (console). Para activarlo, se descomenta la línea `logger: new WinstonLoggerService()` en `main.ts`.

---

## 9. 📁 `database/` — Capa de datos

```
database/
├── database.module.ts          ← Módulo que expone el provider de BD
├── database.providers.ts       ← Configuración de la conexión a SQL Server
├── BD Base.sql                 ← Script SQL de la base de datos (MySQL/Original)
├── bd-mysql.sql                ← Script SQL alternativo
├── entities/
│   ├── entities.provider.ts    ← Provee todos los repositorios (TypeORM)
│   ├── usuario.entity.ts       ← Tabla Usuario
│   ├── rol.entity.ts           ← Tabla Rol
│   ├── menu.entity.ts          ← Tabla Menu
│   ├── acceso.entity.ts        ← Tabla Acceso
│   ├── config.entity.ts        ← Tabla Config
│   ├── keys.entity.ts          ← Tabla Keys (API keys)
│   ├── puesto.entity.ts        ← Tabla Puesto
│   ├── sucursal.entity.ts      ← Tabla Sucursal
│   ├── bitacora-autorizacion.entity.ts ← Tabla Bitácora
│   └── permisos/
│       ├── permiso.entity.ts           ← Tabla Permiso
│       ├── permiso-rol.entity.ts       ← Tabla Permiso_Rol
│       └── permiso-usuario.entity.ts   ← Tabla Permiso_Usuario
└── scripts/
    └── auth.sql                ← Migración: crea tablas y agrega columnas
```

### `database.module.ts` — El módulo de BD

```typescript
@Module({
  providers: [...databaseProviders],   // Provee la conexión
  exports: [...databaseProviders],     // La exporta para que otros módulos la usen
})
export class DatabaseModule {}
```

### `entities/entities.provider.ts` — Los repositorios

Este archivo es **fundamental**: registra cada entidad de TypeORM como un "provider" inyectable. Así los services pueden acceder a las tablas:

```typescript
// Cada entidad se registra con un token único:
{ token: 'USUARIO_REPOSITORY', entity: Usuario }
{ token: 'ROL_REPOSITORY', entity: Rol }
{ token: 'BITACORA_AUTORIZACION_REPOSITORY', entity: BitacoraAutorizacion }
// ... 12 repositorios en total

// En un service se usa así:
@Inject('USUARIO_REPOSITORY')
private readonly usuarioRepository: Repository<Usuario>
```

### Entidades (tablas de la BD)

| Entidad | Tabla | Descripción |
|---|---|---|
| `Usuario` | `auth.Usuario` | Usuarios del sistema (con foto, DPI, etc.) |
| `Rol` | `auth.Rol` | Roles (Admin, Gerente, etc.) con `esAdmin` |
| `Puesto` | `auth.Puesto` | Puestos de trabajo |
| `Sucursal` | `auth.Sucursal` | Sucursales de la empresa |
| `Permiso` | `auth.Permiso` | Permisos granulares (código + nombre) |
| `PermisoRol` | `auth.Permiso_Rol` | Permisos asignados a roles |
| `PermisoUsuario` | `auth.Permiso_Usuario` | Excepciones de permisos por usuario |
| `BitacoraAutorizacion` | `auth.Bitacora_Autorizacion` | Registro de solicitudes de autorización |
| `Menu` | `auth.Menu` | Menús de navegación |
| `Acceso` | `auth.Acceso` | Control de accesos |
| `Keys` | `auth.Keys` | API keys |
| `Config` | `auth.Config` | Configuración general |

### `scripts/auth.sql` — Migración

Este script SQL crea la tabla de bitácora y agrega columnas nuevas a tablas existentes:

```sql
-- 1. Crea la tabla Bitacora_Autorizacion
CREATE TABLE [auth].[Bitacora_Autorizacion] ( ... );

-- 2. Agrega columnas a Usuario
ALTER TABLE [auth].[Usuario] ADD [auth_code] nvarchar(10) NULL;
ALTER TABLE [auth].[Usuario] ADD [autoriza] BIT NOT NULL DEFAULT (0);

-- 3. Agrega columnas a Permiso_Usuario y Permiso_Rol
ALTER TABLE [auth].[Permiso_Usuario] ADD [autoriza] BIT ...;
ALTER TABLE [auth].[Permiso_Rol] ADD [autoriza] BIT ...;

-- 4. Agrega columna a Permiso
ALTER TABLE [auth].[Permiso] ADD [requires_auth] BIT ...;
```

---

## 10. 📁 `test/` — Pruebas

```
test/
├── app.e2e-spec.ts        ← Prueba de extremo a extremo (e2e)
└── jest-e2e.json          ← Configuración de Jest para e2e
```

### `app.e2e-spec.ts`

Una prueba simple que verifica que la ruta raíz responde:

```typescript
it('/ (GET)', () => {
  return request(app.getHttpServer())
    .get('/')
    .expect(200)
    .expect('Hello World!');
});
```

> **Nota:** Esta prueba está desactualizada — el endpoint real retorna JSON, no "Hello World".

---

## 11. 📁 Otros archivos y carpetas

| Carpeta/Archivo | Descripción |
|---|---|
| `uploads/` | Donde se guardan los archivos subidos por los usuarios (perfil, productos, etc.) |
| `logs/` | Archivos de log generados por Winston (rotación diaria) |
| `dist/` | Código compilado (generado por `npm run build`) |
| `node_modules/` | Paquetes instalados por npm (NUNCA se sube a git) |
| `docs/` | Documentación del proyecto (este archivo vive aquí) |
| `STORAGE_MODULE_IMPLEMENTATION_GUIDE.md` | Guía de implementación del módulo Storage |
| `AUDITORIA_ENTIDADES_MIGRACION.md` | Documentación de auditoría de entidades |

---

## 12. 🔗 Cómo se conectan los módulos entre sí

### Diagrama de dependencias

```
                    ┌──────────────┐
                    │  AppModule   │ (Módulo raíz)
                    │              │
                    │  Registra:   │
                    │  - AuthGuard │
                    │  - PermsGuard│
                    │  - Throttler │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────┐      ┌─────────────────┐
    │   AuthModule    │      │  StorageModule  │
    │                 │      │                 │
    │  Controllers:   │      │  Controllers:   │
    │  - Auth         │      │  - Storage      │
    │  - Usuarios     │      │                 │
    │  - Roles        │      │  Services:      │
    │  - Permisos     │      │  - Storage      │
    │  - Bitacora     │      │  - Validation   │
    │  - Accesos      │      │  - Antivirus    │
    │  - ApiKeys      │      │  - EntityUpdate │
    │  - Menu         │      │  - Export       │
    │  - Config       │      │                 │
    │  - Sucursal     │      │  Guards:        │
    │  - Puestos      │      │  - Category     │
    │                 │      │                 │
    │  Imports:       │      │  Imports:       │
    │  - DatabaseModule│     │  - DatabaseModule│
    │  - JwtModule    │      │  - MulterModule │
    └────────┬────────┘      │  - ThrottlerMod │
             │               └────────┬────────┘
             │                        │
             └────────────┬───────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  DatabaseModule  │
                │                  │
                │  Provee:         │
                │  - DATA_SOURCE   │
                │  - Repositorios  │
                │    (12 entidades)│
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │   SQL Server     │
                │   (Base de datos)│
                └──────────────────┘
```

### Flujo de una petición típica

```
Cliente → HTTP Request
    │
    ▼
main.ts (ValidationPipe valida el body)
    │
    ▼
AuthGuard (verifica token JWT)
    │
    ▼
PermissionsGuard (verifica permisos)
    │
    ▼
ThrottlerGuard (rate limiting)
    │
    ▼
Controller (recibe la petición)
    │
    ▼
Service (ejecuta la lógica)
    │
    ├── Repository (consulta la BD)
    │       │
    │       ▼
    │   SQL Server
    │
    ▼
Respuesta formateada por BaseService
    │
    ▼
HttpCustomExceptionFilter (si hay error)
    │
    ▼
Cliente ← HTTP Response (JSON)
```

---

## 13. 🖼️ Resumen visual de la arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     API HVC KAPITAL                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    PRESENTACIÓN                            │  │
│  │  Swagger Docs (/v1/docs)                                   │  │
│  │  Health Check (GET /v1/)                                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    SEGURIDAD                               │  │
│  │  ValidationPipe → AuthGuard → PermissionsGuard → Throttler │  │
│  │                                                              │  │
│  │  Decoradores: @Public, @AdminOnly, @RequirePermissions      │  │
│  │  Filtro: HttpCustomExceptionFilter                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    LÓGICA DE NEGOCIO                       │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │   Auth   │ │ Usuarios │ │  Roles   │ │ Permisos │      │  │
│  │  │ Login    │ │ CRUD     │ │ CRUD     │ │ Sistema  │      │  │
│  │  │ JWT      │ │          │ │          │ │ 3 tablas │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │ Bitácora │ │ Accesos  │ │  Menu    │ │ Sucursal │      │  │
│  │  │ Autoriz. │ │ Control  │ │ Navegac. │ │ Filiales │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │  │
│  │  │  Puestos │ │ ApiKeys  │ │  Config  │                    │  │
│  │  │ Empleados│ │ Ext API  │ │ General  │                    │  │
│  │  └──────────┘ └──────────┘ └──────────┘                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    ALMACENAMIENTO                          │  │
│  │  Upload/Download de archivos                               │  │
│  │  Categorías: perfil, producto, porcion, solicitud, doc     │  │
│  │  Seguridad: validación MIME, magic numbers, path security  │  │
│  │  Exportación: CSV, Excel                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    PERSISTENCIA                            │  │
│  │  TypeORM → SQL Server                                      │  │
│  │  12 entidades en esquema auth                               │  │
│  │  BaseService (formato estándar de respuestas)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    OBSERVABILIDAD                          │  │
│  │  Winston Logger (logs diarios rotativos)                    │  │
│  │  FileLoggingInterceptor (logs de operaciones de archivos)   │  │
│  │  HttpCustomExceptionFilter (logs de errores)                │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Conceptos clave para recordar

| Concepto | Analogía simple |
|---|---|
| **Module** | Un departamento de la empresa (Auth, Storage, etc.) |
| **Controller** | La recepción del departamento (recibe peticiones) |
| **Service** | Los empleados que hacen el trabajo (lógica de negocio) |
| **Entity** | El modelo de una tabla de la BD |
| **Repository** | El acceso directo a una tabla (CRUD) |
| **DTO** | Un formulario que define qué datos son válidos |
| **Guard** | Un guardia de seguridad que decide quién pasa |
| **Interceptor** | Un sensor que registra todo lo que pasa |
| **Pipe** | Un filtro que valida datos antes de procesarlos |
| **Filter** | Un paracaídas que atrapa errores inesperados |
| **Decorator** | Una etiqueta que le dice al framework qué hacer |
| **Provider** | Un servicio que NestJS puede inyectar donde se necesite |
| **Dependency Injection** | "Necesito un X" → NestJS te da una instancia de X |
| **BaseService** | La plantilla de respuestas (todas iguales) |
| **JwtModule** | Configuración global de tokens |
| **MulterModule** | Configuración de subida de archivos |

---

## 📁 Archivos de referencia rápida

| Categoría | Archivos clave |
|---|---|
| **Punto de entrada** | `src/main.ts` |
| **Módulo raíz** | `src/app.module.ts` |
| **Variables de entorno** | `src/config/envs.ts` |
| **Guards globales** | `src/app.module.ts` (APP_GUARD) |
| **Formato de respuestas** | `src/common/services/base.service.ts` |
| **Manejo de errores** | `src/common/exceptions/http-custom-exception.filter.ts` |
| **Proveedores de BD** | `database/entities/entities.provider.ts` |
| **Login** | `src/auth/auth.controller.ts` + `auth.service.ts` |
| **Permisos** | `src/common/guards/permissions.guard.ts` |
| **Config de Swagger** | `src/main.ts` (DocumentBuilder) |
| **Config de CORS** | `src/main.ts` (enableCors) |
| **Subida de archivos** | `src/storage/controllers/storage.controller.ts` |
| **Validación de archivos** | `src/storage/services/file-validation.service.ts` |
