# 📖 Bitácora de Autorización — Flujo de Ejecución

> **Guía para principiantes:** Este documento explica, paso a paso y de la forma más sencilla posible, cómo funciona el módulo de bitácora, cómo se protegen las rutas, qué hacen los guards, decoradores, permisos y cómo todo se conecta.

---

## 📌 Índice

1. [¿Qué es la Bitácora de Autorización?](#1--qué-es-la-bitácora-de-autorización)
2. [Archivos que componen el módulo](#2--archivos-que-componen-el-módulo)
3. [La cadena de seguridad (Guards)](#3--la-cadena-de-seguridad-guards)
4. [Decoradores explicados](#4--decoradores-explicados)
5. [Qué sucede cuando haces una petición](#5--qué-sucede-cuando-haces-una-petición)
6. [Endpoints disponibles](#6--endpoints-disponibles)
7. [Cómo funciona la paginación y búsqueda](#7--cómo-funciona-la-paginación-y-búsqueda)
8. [Documentación en Swagger](#8--documentación-en-swagger)
9. [La base de datos detrás de la bitácora](#9--la-base-de-datos-detrás-de-la-bitácora)
10. [Resumen visual del flujo](#10--resumen-visual-del-flujo)

---

## 1. 📌 ¿Qué es la Bitácora de Autorización?

Imagina que trabajas en una empresa grande. No todas las acciones pueden hacerlas todos: por ejemplo, **eliminar un usuario** podría requerir la aprobación de un gerente antes de ejecutarse.

La **bitácora de autorización** es un **registro** (un "libro de notas") que guarda cada vez que alguien solicita permiso para hacer algo. Registra:

| Campo | Qué significa | Ejemplo |
|---|---|---|
| `endpoint` | La ruta que se quiere ejecutar | `POST /v1/auth/usuarios` |
| `body_request` | El contenido de la petición original | `{"nombre1":"Juan","apellido1":"Perez"}` |
| `solicitanteId` | Quién está pidiendo hacer la acción | UUID del usuario que solicita |
| `autorizadorId` | Quién debe aprobar la solicitud | UUID del gerente que autoriza |
| `permisoId` | Qué permiso se necesita | UUID del permiso "CREAR_USUARIO" |
| `created_at` | Cuándo se creó el registro | `2026-08-26T10:30:00` |

> **En resumen:** Es un sistema de "doble llave" donde alguien pide y alguien aprueba, y todo queda registrado por seguridad.

---

## 2. 📂 Archivos que componen el módulo

El módulo de bitácora vive dentro de `src/auth/bitacora/` y tiene esta estructura:

```
src/auth/bitacora/
├── bitacora.controller.ts    ← Recibe las peticiones HTTP (endpoints)
├── bitacora.service.ts       ← Contiene toda la lógica de negocio
└── dto/
    ├── create-bitacora.dto.ts ← Define qué datos se necesitan para crear un registro
    └── index.ts               ← Exporta el DTO para que otros archivos lo importen
```

### ¿Qué hace cada archivo?

| Archivo | Analogía | Función |
|---|---|---|
| **controller.ts** | El recepcionista | Recibe la petición, la valida y la pasa al service |
| **service.ts** | El gerente | Toma la decisión, consulta la base de datos y responde |
| **dto/** | El formulario | Define qué campos son obligatorios, su tipo y validaciones |

---

## 3. 🔒 La cadena de seguridad (Guards)

Antes de que tu petición llegue al controller, tiene que pasar por una **cadena de guards** (guardias de seguridad). Piensa en ellos como un control de seguridad en un edificio con múltiples puntos de verificación.

### ¿Qué es un Guard?

Un **Guard** es una clase que decide si una petición puede pasar o no. Se ejecutan **antes** del handler del endpoint. Si el guard dice "no", la petición nunca llega al controller.

### La cadena de guards en este proyecto

En `src/app.module.ts` se registran **3 guards globales** (se aplican a TODAS las rutas):

```
PETICIÓN DEL CLIENTE
        │
        ▼
┌─────────────────────┐
│  1. AuthGuard        │  ← ¿Tienes un token JWT válido?
│  (Autenticación)     │     Sí → el usuario se carga en request.user
│                      │     No → ERROR 401 (No autorizado)
└─────────┬───────────┘
          │ (pasa)
          ▼
┌─────────────────────┐
│  2. PermissionsGuard │  ← ¿Tu rol tiene el permiso necesario?
│  (Autorización)      │     Sí → deja pasar
│                      │     No → ERROR 403 (Prohibido)
└─────────┬───────────┘
          │ (pasa)
          ▼
┌─────────────────────┐
│  3. ThrottlerGuard   │  ← ¿Estás haciendo muchas peticiones?
│  (Rate Limiting)     │     No → deja pasar
│                      │     Sí → ERROR 429 (Demasiadas peticiones)
└─────────┬───────────┘
          │ (pasa)
          ▼
    CONTROLLER → SERVICE → RESPUESTA
```

### 3.1 AuthGuard (Autenticación) — "¿Quién eres?"

**Archivo:** `src/common/guards/auth.guard.ts`

Este guard verifica que el usuario **exista** y esté **identificado**. Es como pedirle tu credencial de empleado al entrar al edificio.

**¿Qué hace paso a paso?**

```
1. ¿La ruta es pública? (tiene @Public())
   → Sí: deja pasar sin verificar nada

2. ¿Hay un header Authorization?
   → No: ERROR 401 "Token not found"

3. ¿El header tiene formato "Bearer <token>"?
   → No: ERROR 401

4. ¿El token JWT es válido y no ha expirado?
   → No: ERROR 401 "Invalid or expired token"

5. ¿El usuario existe en la base de datos y está activo?
   → No: ERROR 401 "User not found or inactive"

6. Todo OK: carga el usuario completo en request.user
   (con su rol, puesto y sucursal)
```

**¿Qué es un token JWT?**

Un JWT (JSON Web Token) es como un **permiso firmado digitalmente**. Cuando haces login, el servidor te da un token. Tú lo guardas y lo envías en cada petición. El servidor verifica que sea genuine sin tener que consultar la base de datos en cada petición.

```
Estructura de un JWT:
<header.payload.signature>
 ────────────┬ ────────────────────┬ ──────────
    Header          Payload               Firma
  (algoritmo)    (datos: userId,      (garantiza que
                   fecha expiración)   no fue modificado)
```

**¿Cómo se envía el token?**

En el **header** de la petición HTTP:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
               ─────  ──────────────────────
               Tipo        Token JWT
```

### 3.2 PermissionsGuard (Autorización) — "¿Estás autorizado?"

**Archivo:** `src/common/guards/permissions.guard.ts`

Después de saber **quién eres** (AuthGuard), este guard verifica si **puedes hacer** lo que pides. Es como verificar que tu credencial tenga acceso a la sala del servidor.

**¿Qué hace paso a paso?**

```
1. ¿La ruta declara permisos? (tiene @RequirePermissions())
   → No: deja pasar (no necesita permisos)

2. ¿El usuario fue inyectado por AuthGuard?
   → No: ERROR 401 "Usuario no autenticado"

3. ¿El usuario tiene rol de administrador? (esAdmin = true)
   → Sí: acceso TOTAL, deja pasar inmediatamente

4. Para cada permiso requerido:
   4a. ¿Existe el permiso en la base de datos?
       → No: ERROR 500 (falta configuración)

   4b. ¿Tiene el usuario una excepción individual?
       → Sí, y es "permitido" → continúa (acceso otorgado)
       → Sí, y es "denegado" → ERROR 403

   4c. ¿Su rol tiene el permiso asignado?
       → Sí → continúa
       → No → ERROR 403 "No tiene permiso"

5. Todos los permisos validados: deja pasar
```

### 3.3 AdminOnlyGuard — "¿Eres administrador?"

**Archivo:** `src/common/guards/admin-only.guard.ts`

Este guard es más simple: solo verifica si el usuario tiene el rol de administrador. Se aplica **individualmente** a endpoints específicos (no es global).

```
1. ¿La ruta tiene @AdminOnly()?
   → No: deja pasar

2. ¿El usuario tiene rol con esAdmin = true?
   → Sí: deja pasar
   → No: ERROR 403 "No tienes permisos suficientes"
```

### 3.4 ApiKeyGuard — "¿Tienes la clave API?"

**Archivo:** `src/common/guards/api-key.guard.ts`

Este guard verifica un header llamado `apikey`. Es más simple y se usa para servicios externos.

```
1. ¿El header "apikey" existe?
   → Sí: deja pasar
   → No: ERROR 401 "API key missing"
```

---

## 4. 🎨 Decoradores explicados

Los **decoradores** son etiquetas que se colocan encima de clases o métodos para agregarles comportamiento adicional. En NestJS se usan con el símbolo `@`.

### ¿Qué son los decoradores en este contexto?

Imagina que estás poniendo etiquetas en una caja. La etiqueta dice "FRÁGIL" y el repartidor sabe que debe tratarla con cuidado. Los decoradores funcionan igual: le dicen al framework **qué hacer** con ese método o clase.

### Decoradores usados en la bitácora

#### `@AdminOnly()` — Solo administradores

**Archivo:** `src/common/decorators/admin.decorator.ts`

```typescript
// Así se define:
export const AdminOnly = () => SetMetadata(IS_ADMIN_KEY, true);

// Así se usa (en el controller):
@Delete(':id')
@AdminOnly()          // ← Solo los admin pueden usar este endpoint
remove(@Param('id') id: string) { ... }
```

**¿Qué hace?** Guarda un dato en los metadatos del método que dice "esta ruta requiere admin". El `AdminOnlyGuard` lee ese dato y decide si deja pasar o no.

#### `@RequirePermissions('CODIGO')` — Permisos específicos

**Archivo:** `src/common/decorators/permissions.decorator.ts`

```typescript
// Así se define:
export const RequirePermissions = (...codigos: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codigos);

// Así se usa (no se usa en bitácora directamente, pero es el patrón):
@RequirePermissions('USR01', 'USR02')  // ← Requiere AMBOS permisos
@Post()
create() { ... }
```

**¿Qué hace?** Guarda una lista de códigos de permiso. El `PermissionsGuard` verifica que el usuario tenga TODOS los permisos listados.

#### `@Public()` — Ruta pública (sin autenticación)

**Archivo:** `src/common/decorators/public.decorator.ts`

```typescript
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Ejemplo de uso:
@Public()         // ← Cualquiera puede usar esto, sin token
@Get('login')
login() { ... }
```

**¿Qué hace?** Le dice al `AuthGuard` que no verifique el token. Útil para rutas de login o registro.

#### `@GetUser()` — Obtener el usuario del request

**Archivo:** `src/common/decorators/get-user.decorator.ts`

```typescript
// Así se usa en un controller:
@Get('perfil')
getProfile(@GetUser() user: Usuario) {
  // user ya contiene el objeto completo del usuario logueado
  return user;
}
```

**¿Qué hace?** Extrae el objeto `request.user` (que fue cargado por el AuthGuard) y lo inyecta directamente como parámetro del método.

### Decoradores de documentación (Swagger)

Estos decoradores no afectan la lógica, solo documentan la API para Swagger:

| Decorador | Qué documenta | Ejemplo |
|---|---|---|
| `@ApiTags('Nombre')` | Agrupa endpoints en una sección | `@ApiTags('Bitácora de Autorización')` |
| `@ApiBearerAuth('jwt')` | Indica que necesita token | Se agrega al controller completo |
| `@ApiOperation({})` | Descripción del endpoint | Título y descripción en Swagger |
| `@ApiParam({})` | Parámetros de URL | `{ name: 'id', format: 'uuid' }` |
| `@ApiResponse({})` | Códigos de respuesta posibles | `{ status: 200, description: 'OK' }` |
| `@ApiProperty()` | Propiedades del body (DTO) | Se usa en el DTO para documentar campos |

---

## 5. 🔄 Qué sucede cuando haces una petición

### Ejemplo 1: Crear un registro de bitácora

```
PETICIÓN:
  POST /v1/auth/bitacora
  Headers:
    Authorization: Bearer eyJhbGci...    ← Token JWT
    Content-Type: application/json
  Body:
    {
      "endpoint": "POST /v1/auth/usuarios",
      "body_request": "{\"nombre1\":\"Juan\"}",
      "solicitanteId": "uuid-del-solicitante",
      "autorizadorId": "uuid-del-autorizador",
      "permisoId": "uuid-del-permiso"
    }
```

**Paso a paso de lo que sucede internamente:**

```
  ① Cliente envía POST /v1/auth/bitacora
       │
       ▼
  ② AuthGuard verifica el token JWT
       │  → Extrae "Bearer eyJhbGci..." del header Authorization
       │  → Verifica la firma y que no esté expirado
       │  → Busca el usuario en la BD con el userId del token
       │  → Carga el usuario (con rol, puesto, sucursal) en request.user
       │  → ¡Pasa!
       │
       ▼
  ③ PermissionsGuard verifica permisos
       │  → La ruta NO tiene @RequirePermissions() definido
       │  → No hay nada que verificar → ¡Pasa!
       │
       ▼
  ④ ThrottlerGuard verifica rate limiting
       │  → ¿Has hecho muchas peticiones recientemente?
       │  → No → ¡Pasa!
       │
       ▼
  ⑤ ValidationPipe valida el body
       │  → Verifica que los campos coincidan con CreateBitacoraDto
       │  → endpoint: string, no vacío, máx 100 chars ✓
       │  → body_request: string ✓
       │  → solicitanteId: UUID válido ✓
       │  → autorizadorId: UUID válido ✓
       │  → permisoId: UUID válido ✓
       │  → ¡Validado!
       │
       ▼
  ⑥ BitacoraController.create() recibe el DTO
       │  → Simplemente llama a bitacoraService.create(dto)
       │
       ▼
  ⑦ BitacoraService.create() ejecuta la lógica
       │  → Valida que el solicitante exista en la BD
       │  → Valida que el autorizador exista en la BD
       │  → Valida que el permiso exista en la BD
       │  → Crea el registro en la tabla Bitacora_Autorizacion
       │  → Retorna respuesta con formato estándar
       │
       ▼
  ⑧ Respuesta al cliente
       {
         "success": true,
         "statusCode": "201",
         "path": "auth/bitacora",
         "timestamp": "26/08/2026 10:30:00",
         "message": "Registro de bitácora creado exitosamente",
         "data": {
           "id": "uuid-del-registro",
           "endpoint": "POST /v1/auth/usuarios",
           "solicitante": { ... },
           "autorizador": { ... },
           "permiso": { ... },
           "created_at": "2026-08-26T10:30:00"
         },
         "metadata": null
       }
```

### Ejemplo 2: Eliminar un registro (solo admin)

```
PETICIÓN:
  DELETE /v1/auth/bitacora/uuid-del-registro
  Headers:
    Authorization: Bearer eyJhbGci...
```

```
  ① AuthGuard → Token válido → ¡Pasa!
  ② PermissionsGuard → No tiene @RequirePermissions → ¡Pasa!
  ③ AdminOnlyGuard → ¿El endpoint tiene @AdminOnly()?
       │  → SÍ, está marcado
       │  → ¿El usuario tiene rol con esAdmin = true?
       │     → Sí: ¡Pasa!
       │     → No: ERROR 403 "No tienes permisos suficientes"
       │
       ▼
  ④ BitacoraController.remove() → BitacoraService.remove(id)
```

---

## 6. 📋 Endpoints disponibles

| Método | Ruta | Descripción | ¿Necesita auth? | ¿Necesita admin? |
|---|---|---|---|---|
| `POST` | `/auth/bitacora` | Crear un registro | ✅ Sí | ❌ No |
| `GET` | `/auth/bitacora` | Listar registros (paginado) | ✅ Sí | ❌ No |
| `GET` | `/auth/bitacora/solicitante/:id` | Registros de un solicitante | ✅ Sí | ❌ No |
| `GET` | `/auth/bitacora/pendientes/:id` | Pendientes de un autorizador | ✅ Sí | ❌ No |
| `GET` | `/auth/bitacora/:id` | Ver un registro por UUID | ✅ Sí | ❌ No |
| `DELETE` | `/auth/bitacora/:id` | Eliminar un registro | ✅ Sí | ✅ **Solo admin** |

> **Nota:** Todas las rutas requieren token JWT porque el `AuthGuard` es global y ninguna está marcada con `@Public()`.

---

## 7. 🔍 Cómo funciona la paginación y búsqueda

Los endpoints de tipo `GET` que listan registros aceptan estos parámetros de query string:

```
GET /v1/auth/bitacora?page=2&limit=10&busqueda=admin&todos=false
```

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | número | `1` | Página a consultar (empieza en 1) |
| `limit` | número | `10` | Registros por página |
| `busqueda` | string | — | Filtra por endpoint, nombre de usuario o código de permiso |
| `todos` | boolean | `false` | Si es `true`, ignora la paginación y devuelve todo |

**Ejemplo de respuesta paginada:**

```json
{
  "success": true,
  "statusCode": "200",
  "data": [ ... ],
  "metadata": {
    "total": 45,
    "page": 2,
    "limit": 10
  }
}
```

**Cómo funciona la búsqueda (`busqueda`):**

El parámetro `busqueda` hace una búsqueda de texto libre en varios campos a la vez:

```sql
-- Internamente se genera algo como:
WHERE LOWER(bitacora.endpoint) LIKE '%admin%'
   OR LOWER(solicitante.userName) LIKE '%admin%'
   OR LOWER(autorizador.userName) LIKE '%admin%'
   OR LOWER(permiso.codigo) LIKE '%admin%'
```

Esto significa que si buscas "admin", encontrarás registros donde:
- El endpoint contiene "admin"
- El solicitante tiene "admin" en su nombre
- El autorizador tiene "admin" en su nombre
- El código del permiso contiene "admin"

---

## 8. 📚 Documentación en Swagger

Swagger es una herramienta que genera **documentación interactiva** de tu API. En este proyecto está configurada en `src/main.ts`.

### ¿Cómo se accede?

```
http://localhost:{puerto}/v1/docs
```

### ¿Cómo se usa?

1. Abres la URL en tu navegador
2. Haces clic en el botón **"Authorize"**
3. Pegas tu token JWT (obtenido en `POST /auth/login`)
4. Ahora puedes probar los endpoints directamente desde la página

### ¿Cómo se documenta un endpoint?

Cada endpoint en el controller tiene decoradores que Swagger lee para generar la documentación:

```typescript
@Post()                                    // Método HTTP
@ApiTags('Bitácora de Autorización')       // Sección en Swagger
@ApiBearerAuth('jwt')                      // Requiere token JWT
@ApiOperation({                            // Título y descripción
  summary: 'Registrar una entrada en la bitácora',
  description: 'Registra una solicitud de autorización...',
})
@ApiResponse({ status: 201, ... })         // Respuesta exitosa
@ApiResponse({ status: 400, ... })         // Error de validación
@ApiResponse({ status: 404, ... })         // No encontrado
create(@Body() dto: CreateBitacoraDto) { ... }
```

Swagger genera automáticamente una tabla como esta en la documentación:

```
POST /auth/bitacora
├── Summary: Registrar una entrada en la bitácora
├── Auth: Bearer Token (JWT)
├── Request Body: CreateBitacoraDto
│   ├── endpoint (string, requerido)
│   ├── body_request (string, requerido)
│   ├── solicitanteId (UUID, requerido)
│   ├── autorizadorId (UUID, requerido)
│   └── permisoId (UUID, requerido)
├── Responses:
│   ├── 201: Registro creado correctamente
│   ├── 400: El cuerpo enviado no es válido
│   └── 404: Solicitante, autorizador o permiso no encontrado
```

### Configuración global de Swagger

En `main.ts` se configuran cosas globales:

```typescript
// Prefijo global: todas las rutas empiezan con /v1
app.setGlobalPrefix(envs.prefix);

// Respuestas globales (aparecen en TODOS los endpoints)
.addGlobalResponse({ status: 401, description: 'Token ausente...' })
.addGlobalResponse({ status: 403, description: 'Sin permiso...' })
.addGlobalResponse({ status: 500, description: 'Error interno...' })

// Swagger UI guarda el token entre recargas
swaggerOptions: { persistAuthorization: true }
```

---

## 9. 🗄️ La base de datos detrás de la bitácora

### Tabla principal: `Bitacora_Autorizacion`

La tabla está en el esquema `auth` de SQL Server:

```sql
CREATE TABLE [auth].[Bitacora_Autorizacion] (
    [id]            uniqueidentifier PRIMARY KEY,  -- UUID único
    [endpoint]      nvarchar(100) NOT NULL,         -- Ruta del endpoint
    [metodo_http]   nvarchar(10) NOT NULL,          -- GET, POST, etc.
    [body_request]  nvarchar(MAX) NOT NULL,         -- Body de la petición
    [solicitanteId] uniqueidentifier NOT NULL,      -- FK → Usuario
    [autorizadorId] uniqueidentifier NOT NULL,      -- FK → Usuario
    [permisoId]     uniqueidentifier NOT NULL,      -- FK → Permiso
    [created_at]    DATETIME DEFAULT GETDATE()      -- Fecha automática
);
```

### Relaciones (TypeORM)

```
Bitacora_Autorizacion
├── solicitante → Usuario (ManyToOne)
├── autorizador → Usuario (ManyToOne)
└── permiso     → Permiso (ManyToOne)
```

Las relaciones se definen en el entity con `@ManyToOne` y `@JoinColumn`. Cuando el service hace `leftJoinAndSelect`, automáticamente carga los datos completos del solicitante, autorizador y permiso.

### Entity en TypeORM

```typescript
// database/entities/bitacora-autorizacion.entity.ts

@Entity({ schema: 'auth', name: 'Bitacora_Autorizacion' })
export class BitacoraAutorizacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitanteId' })
  solicitante!: Usuario;

  // ... más campos
}
```

El `onDelete: 'RESTRICT'` significa que **no puedes eliminar** un usuario si tiene registros en la bitácora (protección de integridad referencial).

### Campos adicionales agregados por la migración

El script `database/scripts/auth.sql` también agrega columnas importantes a otras tablas:

| Tabla | Campo | Tipo | Descripción |
|---|---|---|---|
| `Usuario` | `auth_code` | nvarchar(10) | Código de autorización del usuario (único) |
| `Usuario` | `autoriza` | BIT | Si el usuario puede autorizar (true/false) |
| `Permiso_Usuario` | `autoriza` | BIT | Si el permiso requiere autorización para este usuario |
| `Permiso_Rol` | `autoriza` | BIT | Si el permiso requiere autorización para este rol |
| `Permiso` | `requires_auth` | BIT | Si el permiso requiere autorización |

---

## 10. 🖼️ Resumen visual del flujo completo

```
┌──────────────────────────────────────────────────────────────┐
│                     FLUJO COMPLETO                            │
│                                                              │
│  CLIENTE                                                     │
│    │                                                         │
│    │  POST /v1/auth/bitacora                                 │
│    │  Authorization: Bearer eyJhbGci...                      │
│    │  Body: { endpoint, body_request, solicitanteId, ... }   │
│    │                                                         │
│    ▼                                                         │
│  ┌──────────────────────────────────────────┐                │
│  │  VALIDACIÓN DEL PIPE (ValidationPipe)    │                │
│  │  → Verifica tipos, longitudes, UUIDs     │                │
│  │  → ¿Error? → 400 Bad Request            │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │  GUARD 1: AuthGuard (GLOBAL)             │                │
│  │  → Extrae token del header Authorization │                │
│  │  → Verifica JWT con jwtSecret           │                │
│  │  → Carga usuario completo en request     │                │
│  │  → ¿Error? → 401 Unauthorized           │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │  GUARD 2: PermissionsGuard (GLOBAL)      │                │
│  │  → ¿Tiene @RequirePermissions()?         │                │
│  │     No → deja pasar                      │                │
│  │     Sí → verifica permisos del usuario   │                │
│  │  → ¿Error? → 403 Forbidden              │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │  GUARD 3: ThrottlerGuard (GLOBAL)        │                │
│  │  → Rate limiting (30 req/seg, 300/min)   │                │
│  │  → ¿Error? → 429 Too Many Requests       │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │  CONTROLLER: BitacoraController.create() │                │
│  │  → Llama a bitacoraService.create(dto)   │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │  SERVICE: BitacoraService.create()       │                │
│  │  → Valida solicitante, autorizador,      │                │
│  │    permiso en la BD                       │                │
│  │  → Crea registro en BD                   │                │
│  │  → Retorna respuesta formateada          │                │
│  └─────────────┬────────────────────────────┘                │
│                │                                             │
│                ▼                                             │
│  RESPUESTA AL CLIENTE                                        │
│  {                                                           │
│    "success": true,                                          │
│    "statusCode": "201",                                      │
│    "message": "Registro creado exitosamente",                │
│    "data": { id, endpoint, solicitante, autorizador, ... },  │
│    "timestamp": "26/08/2026 10:30:00"                        │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Conceptos clave para recordar

| Concepto | Analogía simple |
|---|---|
| **Guard** | Un guardia de seguridad que decide quién pasa |
| **Decorador** | Una etiqueta que le dice al framework qué hacer |
| **@Public()** | "Esta puerta no necesita credencial" |
| **@AdminOnly()** | "Solo gerentes pueden pasar" |
| **@RequirePermissions()** | "Necesitas tener estos permisos en tu credencial" |
| **DTO** | Un formulario que define qué datos son válidos |
| **JWT** | Un pase firmado que demuestra quién eres |
| **Bearer Token** | "Presento este pase para entrar" |
| **Rate Limiting** | Control de aforo (no más de X personas por minuto) |
| **Swagger** | El manual de instrucciones de tu API |
| **Bitácora** | El libro de registro de todas las solicitudes |
| **Service** | La lógica de negocio (dónde pasan las cosas) |
| **Controller** | El punto de entrada que recibe las peticiones |
| **Pipe** | Un filtro que valida los datos antes de procesarlos |

---

## 📁 Archivos de referencia

| Archivo | Ruta |
|---|---|
| Controller | `src/auth/bitacora/bitacora.controller.ts` |
| Service | `src/auth/bitacora/bitacora.service.ts` |
| DTO | `src/auth/bitacora/dto/create-bitacora.dto.ts` |
| Entity | `database/entities/bitacora-autorizacion.entity.ts` |
| SQL Script | `database/scripts/auth.sql` |
| AuthGuard | `src/common/guards/auth.guard.ts` |
| PermissionsGuard | `src/common/guards/permissions.guard.ts` |
| AdminOnlyGuard | `src/common/guards/admin-only.guard.ts` |
| ApiKeyGuard | `src/common/guards/api-key.guard.ts` |
| AdminOnly decorator | `src/common/decorators/admin.decorator.ts` |
| RequirePermissions | `src/common/decorators/permissions.decorator.ts` |
| Public decorator | `src/common/decorators/public.decorator.ts` |
| GetUser decorator | `src/common/decorators/get-user.decorator.ts` |
| AppModule (guards) | `src/app.module.ts` |
| Main (Swagger config) | `src/main.ts` |
