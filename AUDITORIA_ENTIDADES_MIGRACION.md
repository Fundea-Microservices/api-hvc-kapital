# Auditoría de Entidades — Migración de Autorización

> **Fecha:** 2026-08-25  
> **Tipo de cambio:** Sincronización de entidades TypeORM con migración SQL Server  
> **Archivos afectados:** 6 (5 modificados + 1 creado)

---

## 📋 Resumen de Cambios

| Tabla SQL Server | Entity TypeORM | Cambio |
|---|---|---|
| `Permiso` | `permiso.entity.ts` | +1 columna: `requires_auth` |
| `Permiso_Rol` | `permiso-rol.entity.ts` | +1 columna: `autoriza` |
| `Permiso_Usuario` | `permiso-usuario.entity.ts` | +1 columna: `autoriza` |
| `Usuario` | `usuario.entity.ts` | +2 columnas: `auth_code`, `autoriza` |
| `Bitacora_Autorizacion` | `bitacora-autorizacion.entity.ts` | **Tabla nueva** |
| `entities.provider.ts` | Registro de providers | +1 token: `BITACORA_AUTORIZACION_REPOSITORY` |

---

## 1. 🏗️ Campos Agregados por Entidad

### 1.1 Permiso (`database/entities/permisos/permiso.entity.ts`)

```typescript
@Column({ type: 'bit', default: false })
requires_auth!: boolean;
```

| Propiedad SQL | `requires_auth` |
|---|---|
| Tipo SQL | `BIT NOT NULL DEFAULT (0)` |
| Tipo TS | `boolean` |
| Default | `false` |
| Propósito | Indica si el permiso requiere un proceso de autorización adicional antes de ejecutarse. Cuando es `true`, la acción asociada al permiso no se ejecuta directamente sino que pasa por un flujo de autorización (bitácora + aprobación). |

---

### 1.2 PermisoRol (`database/entities/permisos/permiso-rol.entity.ts`)

```typescript
@Column({ type: 'bit', default: false })
autoriza!: boolean;
```

| Propiedad SQL | `autoriza` |
|---|---|
| Tipo SQL | `BIT NOT NULL DEFAULT (0)` |
| Tipo TS | `boolean` |
| Default | `false` |
| Propósito | Marca si un rol tiene capacidad de **autorizar** acciones que requieren `requires_auth`. Un usuario con este rol asignado puede aprobar solicitudes de autorización de otros usuarios. |

---

### 1.3 PermisoUsuario (`database/entities/permisos/permiso-usuario.entity.ts`)

```typescript
@Column({ type: 'bit', default: false })
autoriza!: boolean;
```

| Propiedad SQL | `autoriza` |
|---|---|
| Tipo SQL | `BIT NOT NULL DEFAULT (0)` |
| Tipo TS | `boolean` |
| Default | `false` |
| Propósito | Permite habilitar la capacidad de autorización a un **usuario individual**, sin necesidad de cambiar su rol. Tiene prioridad sobre el valor heredado del rol (misma lógica que `permitido`). |

---

### 1.4 Usuario (`database/entities/usuario.entity.ts`)

```typescript
// Campo 1
@Column({ type: 'varchar', length: 10, nullable: true, unique: true })
auth_code?: string;

// Campo 2
@Column({ type: 'bit', default: false })
autoriza!: boolean;
```

| Propiedad SQL | `auth_code` | `autoriza` |
|---|---|---|
| Tipo SQL | `nvarchar(10) NULL` | `BIT NOT NULL DEFAULT (0)` |
| Tipo TS | `string \| undefined` | `boolean` |
| Default | `null` | `false` |
| Unique | Sí (índice filtrado `UQ_Usuario_auth_code`) | No |
| Propósito | Código de autorización personal del usuario (ej: PIN de 2 dígitos para confirmar acciones sensibles). Se usa como mecanismo de doble verificación. | Indica si el usuario tiene la capacidad de **autorizar** acciones de otros usuarios. Flag a nivel de cuenta. |

**Nota sobre el índice único filtrado:** SQL Server crea un índice `UQ_Usuario_auth_code` que solo aplica cuando `auth_code IS NOT NULL`. Esto permite que múltiples usuarios tengan `NULL` sin conflicto, pero dos usuarios no pueden tener el mismo `auth_code` no-nulo.

---

### 1.5 BitacoraAutorizacion (`database/entities/bitacora-autorizacion.entity.ts`) — **NUEVA**

```typescript
@Entity({ schema: 'auth', name: 'Bitacora_Autorizacion' })
export class BitacoraAutorizacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint!: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  body_request!: string;

  @Column({ type: 'uuid', nullable: false })
  solicitanteId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitanteId' })
  solicitante!: Usuario;

  @Column({ type: 'uuid', nullable: false })
  autorizadorId!: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorizadorId' })
  autorizador!: Usuario;

  @Column({ type: 'uuid', nullable: false })
  permisoId!: string;

  @ManyToOne(() => Permiso, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'permisoId' })
  permiso!: Permiso;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  created_at!: Date;
}
```

| Columna | Tipo SQL | Tipo TS | FK hacia | Propósito |
|---|---|---|---|---|
| `id` | `uniqueidentifier` (PK, NEWID) | `string` (UUID) | — | Identificador único del registro de bitácora |
| `endpoint` | `nvarchar(100)` NOT NULL | `string` | — | Ruta del endpoint que se está autorizando (ej: `POST /v1/auth/usuarios`) |
| `body_request` | `nvarchar(MAX)` NOT NULL | `string` | — | Cuerpo completo de la petición HTTP original (JSON serializado) |
| `solicitanteId` | `uniqueidentifier` NOT NULL | `string` (UUID) | `Usuario.id` | Quién está pidiendo la autorización |
| `autorizadorId` | `uniqueidentifier` NOT NULL | `string` (UUID) | `Usuario.id` | Quién debe aprobar la solicitud |
| `permisoId` | `uniqueidentifier` NOT NULL | `string` (UUID) | `Permiso.id` | Qué permiso se requiere para autorizar |
| `created_at` | `DATETIME` (GETDATE) | `Date` | — | Timestamp de cuándo se creó el registro |

**Relaciones TypeORM:**
- `solicitante`: `ManyToOne → Usuario` (RESTRICT — no se puede borrar un usuario que tiene solicitudes)
- `autorizador`: `ManyToOne → Usuario` (RESTRICT)
- `permiso`: `ManyToOne → Permiso` (RESTRICT)

---

## 2. 🔧 Registro del Provider

En `database/entities/entities.provider.ts` se agregó:

```typescript
import { BitacoraAutorizacion } from './bitacora-autorizacion.entity';

// Dentro del array entities:
{ token: 'BITACORA_AUTORIZACION_REPOSITORY', entity: BitacoraAutorizacion },
```

Esto permite inyectar el repositorio en cualquier servicio:

```typescript
@Inject('BITACORA_AUTORIZACION_REPOSITORY')
private readonly bitacoraRepository: Repository<BitacoraAutorizacion>
```

---

## 3. 🔄 Cómo se Relaciona TypeORM con Services, Controllers y Endpoints

### 3.1 Flujo de Datos

```
SQL Server Table          TypeORM Entity           Service                Controller             Endpoint
─────────────────       ─────────────────       ──────────             ──────────             ─────────
auth.Permiso       ←→   Permiso.entity.ts   ←→  PermisoService    ←→  PermisosController  ←→  /auth/permisos
auth.Permiso_Rol   ←→   PermisoRol.entity   ←→  PermisoRolService ←→  PermisosController  ←→  /auth/permisos/rol
auth.Permiso_Usuario←→  PermisoUsuario.ent  ←→  PermisoUsuarioSvc ←→  PermisosController  ←→  /auth/permisos/usuario
auth.Usuario       ←→   Usuario.entity.ts   ←→  UsuariosService   ←→  UsuariosController  ←→  /auth/usuarios
auth.Bitacora_Autoriz←→ BitacoraAutoriz.ent ←→  (pendiente crear) ←→  (pendiente crear)   ←→  (pendiente crear)
```

### 3.2 Cómo Funciona el Mapeo

**1. Entity → Tabla SQL:**
El decorador `@Entity({ schema: 'auth', name: 'Permiso' })` indica a TypeORM que la clase `Permiso` se mapea a la tabla `[auth].[Permiso]` en SQL Server.

**2. Column → Campo:**
Cada `@Column()` mapea una columna de la tabla a una propiedad de la clase:
```typescript
// SQL: [requires_auth] BIT NOT NULL DEFAULT (0)
// TypeScript:
@Column({ type: 'bit', default: false })
requires_auth!: boolean;
```

**3. Relaciones:**
```typescript
// SQL: CONSTRAINT bit_auth_solicitante FOREIGN KEY (solicitanteId) REFERENCES Usuario(id)
// TypeScript:
@ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'solicitanteId' })
solicitante!: Usuario;
```

**4. Provider → Repositorio:**
En `entities.provider.ts` se registra cada entity con un token que la inyecta como `Repository<T>`:
```typescript
provide: 'BITACORA_AUTORIZACION_REPOSITORY',
useFactory: (dataSource: DataSource) => dataSource.getRepository(BitacoraAutorizacion),
inject: ['DATA_SOURCE_SQLSERVER'],
```

**5. Service → Repositorio:**
El servicio inyecta el repositorio y usa los métodos de TypeORM:
```typescript
@Injectable()
export class BitacoraService extends BaseService {
  constructor(
    @Inject('BITACORA_AUTORIZACION_REPOSITORY')
    private readonly bitacoraRepo: Repository<BitacoraAutorizacion>,
  ) { super(); }

  async create(dto: CreateBitacoraDto) {
    const registro = this.bitacoraRepo.create(dto);
    return this.bitacoraRepo.save(registro);
  }
}
```

**6. Controller → Service:**
El controlador recibe el DTO validado y delega al servicio:
```typescript
@Controller('auth/bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Post()
  create(@Body() dto: CreateBitacoraDto) {
    return this.bitacoraService.create(dto);
  }
}
```

### 3.3 Dependencias para el Nuevo Módulo

Para que `BitacoraAutorizacion` funcione completamente, se necesita:

| Archivo | Cambio requerido |
|---|---|
| `database/entities/entities.provider.ts` | ✅ Ya registrado |
| `src/auth/auth.module.ts` | Agregar controller + service al array `controllers` y `providers` |
| `src/auth/bitacora/bitacora.service.ts` | **Crear** — lógica de CRUD |
| `src/auth/bitacora/bitacora.controller.ts` | **Crear** — endpoints REST |
| `src/auth/bitacora/dto/create-bitacora.dto.ts` | **Crear** — validación de entrada |
| DTOs de paginación | Usar `PaginationDto` existente o crear uno específico |

---

## 4. 📐 Decoradores TypeORM Utilizados

| Decorador | Uso en este proyecto | Equivalente SQL |
|---|---|---|
| `@Entity({ schema, name })` | Define tabla y schema | `CREATE TABLE [schema].[name]` |
| `@PrimaryGeneratedColumn('uuid')` | PK auto-generada UUID | `uniqueidentifier DEFAULT NEWID()` |
| `@PrimaryColumn({ type: 'uuid' })` | PK compuesta (no auto) | Parte de `PRIMARY KEY (a, b)` |
| `@Column({ type, length, nullable, unique, default })` | Columna estándar | `col TYPE [NOT NULL] [DEFAULT x] [UNIQUE]` |
| `@CreateDateColumn()` | Auto-inserta fecha de creación | `DEFAULT GETDATE()` |
| `@UpdateDateColumn()` | Auto-actualiza en save() | Se maneja vía ORM |
| `@DeleteDateColumn()` | Soft delete | `deleted_at` column |
| `@ManyToOne(() => Entidad, { onDelete })` | FK Many-to-One | `FOREIGN KEY ... REFERENCES ... ON DELETE ...` |
| `@OneToMany(() => Entidad, ent => ent.rel)` | Relación inversa (1:N) | Se infiere del lado N:1 |
| `@JoinColumn({ name })` | Nombre de la columna FK | `ALTER TABLE ADD CONSTRAINT FK ... FOREIGN KEY (col)` |

---

## 5. 🏷️ Etiquetas Swagger Agregadas (pendientes)

Cuando se creen los endpoints para BitacoraAutorizacion, se recomienda usar:

```typescript
@ApiTags('Bitácora de Autorización')
@ApiBearerAuth('jwt')
@Controller('auth/bitacora')
```

Los DTOs deben incluir `@ApiProperty()` y `@ApiPropertyOptional()` para documentación automática en `/v1/docs`.

---

## 6. ⚠️ Notas Importantes

1. **`synchronize: false`**: La BD y las entities deben mantenerse en sync manualmente. Si se modifica una entity, se debe ejecutar el script SQL correspondiente.

2. **Bitácora como auditoría**: La tabla `Bitacora_Autorizacion` no tiene `updated_at` ni `deleted_at` porque es una tabla de solo escritura (append-only log). Los registros nunca se modifican ni eliminan.

3. **`onDelete: 'RESTRICT'` en Bitacora**: No se puede eliminar un `Usuario` o `Permiso` que tenga registros en la bitácora. Esto es intencional para preservar el historial de auditoría.

4. **El campo `body_request` es `nvarchar(MAX)`**: Almacena el JSON completo de la petición original. En TypeORM se mapea como `nvarchar` con `length: 'MAX'`. Esto permite almacenar payloads grandes, pero se debe tener cuidado con el rendimiento de consultas sobre esta columna.

5. **`auth_code` tiene índice único filtrado**: Solo aplica cuando el valor no es `NULL`. TypeORM lo maneja con `unique: true`, pero el índice real en SQL Server es filtrado (como muestra el script de migración).
