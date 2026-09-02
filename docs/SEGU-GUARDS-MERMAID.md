# 🔐 Diagramas Mermaid — Cadena de Seguridad (Guards)

> **Para visualizar estos diagramas:** Abre este archivo en GitHub, GitLab, VS Code (con extensión Markdown Preview Mermaid Support), o en [mermaid.live](https://mermaid.live). Los diagramas son interactivos: puedes hacer clic en los nodos para ver detalles.

---

## 📌 Índice

1. [Flujo completo de seguridad](#1--flujo-completo-de-seguridad)
2. [AuthGuard — Flujo interno](#2--authguard--flujo-interno)
3. [PermissionsGuard — Flujo interno](#3--permissionsguard--flujo-interno)
4. [AdminOnlyGuard — Flujo interno](#4--adminonlyguard--flujo-interno)
5. [ThrottlerGuard — Flujo interno](#5--throttlerguard--flujo-interno)
6. [Flujo completo de una petición](#6--flujo-completo-de-una-petición)
7. [Jerarquía de decisión de permisos](#7--jerarquía-de-decisión-de-permisos)
8. [Relación Decorador → Guard → Guard](#8--relación-decorador--guard--guard)
9. [Flujo de Login y generación de JWT](#9--flujo-de-login-y-generación-de-jwt)
10. [Flujo del módulo Storage con guards](#10--flujo-del-módulo-storage-con-guards)

---

## 1. Flujo completo de seguridad

```mermaid
flowchart TD
    REQ["🌐 Petición HTTP del Cliente<br/><i>Headers: Authorization, Content-Type</i>"]

    subgraph VALIDATION["🔍 PASO 1 — ValidationPipe"]
        V1["Recibe el body de la petición"]
        V2{"¿Los datos coinciden<br/>con el DTO?"}
        V3["Transforma y limpia datos<br/>(whitelist, transform)"]
        V4["❌ ERROR 400<br/>Datos no válidos"]
    end

    subgraph AUTH["🛡️ PASO 2 — AuthGuard (GLOBAL)"]
        A1{"¿La ruta tiene<br/>@Public()?"}
        A2["Deja pasar sin verificar"]
        A3{"¿Existe header<br/>Authorization?"}
        A4["❌ ERROR 401<br/>Token not found"]
        A5{"¿Formato<br/>'Bearer token'?"}
        A6["❌ ERROR 401<br/>Token inválido"]
        A7{"¿El JWT es válido<br/>y no expiró?"}
        A8["❌ ERROR 401<br/>Invalid or expired token"]
        A9{"¿El usuario existe<br/>y está activo?"}
        A10["❌ ERROR 401<br/>User not found"]
        A11["✅ Carga usuario en<br/>request.user"]
    end

    subgraph PERMISSIONS["🔑 PASO 3 — PermissionsGuard (GLOBAL)"]
        P1{"¿La ruta tiene<br/>@RequirePermissions()?"}
        P2["Deja pasar<br/>(no necesita permisos)"]
        P3{"¿request.user<br/>existe?"}
        P4["❌ ERROR 401<br/>No autenticado"]
        P5{"¿Rol tiene<br/>esAdmin = true?"}
        P6["✅ Acceso TOTAL<br/>(admin bypass)"]
        P7["Para cada permiso requerido..."]
        P8{"¿Excepción individual?<br/>(Permiso_Usuario)"}
        P9{"¿permiso.permitido?"}
        P10["✅ Permiso concedido<br/>por excepción"]
        P11["❌ ERROR 403<br/>Excepción deniega"]
        P12{"¿Su rol tiene<br/>el permiso?"}
        P13["✅ Permiso concedido<br/>por rol"]
        P14["❌ ERROR 403<br/>Sin permiso"]
    end

    subgraph THROTTLE["⏱️ PASO 4 — ThrottlerGuard (GLOBAL)"]
        T1{"¿Cuántas peticiones<br/>has hecho?"}
        T2["✅ Dentro del límite<br/>(30/seg, 300/min, 1000/hora)"]
        T3["❌ ERROR 429<br/>Too Many Requests"]
    end

    subgraph EXECUTION["🚀 PASO 5 — Ejecución"]
        EX1["Controller recibe la petición"]
        EX2["Service ejecuta la lógica"]
        EX3["Repository consulta la BD"]
        EX4["Respuesta formateada"]
    end

    REQ --> V1
    V1 --> V2
    V2 -->|"✅ Válido"| V3
    V2 -->|"❌ Inválido"| V4
    V3 --> A1
    V4 --> ERROR["🚫 HttpCustomExceptionFilter<br/>Retorna JSON de error"]
    A1 -->|"Sí"| A2
    A1 -->|"No"| A3
    A2 --> EXECUTION
    A3 -->|"No"| A4
    A3 -->|"Sí"| A5
    A4 --> ERROR
    A5 -->|"No"| A6
    A5 -->|"Sí"| A7
    A6 --> ERROR
    A7 -->|"No"| A8
    A7 -->|"Sí"| A9
    A8 --> ERROR
    A9 -->|"No"| A10
    A9 -->|"Sí"| A11
    A10 --> ERROR
    A11 --> P1
    P1 -->|"No"| P2
    P1 -->|"Sí"| P3
    P2 --> T1
    P3 -->|"No"| P4
    P3 -->|"Sí"| P5
    P4 --> ERROR
    P5 -->|"Sí"| P6
    P5 -->|"No"| P7
    P6 --> T1
    P7 --> P8
    P8 -->|"Sí"| P9
    P8 -->|"No"| P12
    P9 -->|"permitido"| P10
    P9 -->|"denegado"| P11
    P10 --> P12
    P11 --> ERROR
    P12 -->|"Sí"| P13
    P12 -->|"No"| P14
    P13 --> T1
    P14 --> ERROR
    T1 -->|"≤ 30/seg"| T2
    T1 -->|"> 30/seg"| T3
    T2 --> EX1
    T3 --> ERROR
    EX1 --> EX2
    EX2 --> EX3
    EX3 --> EX4
    EX4 --> RESP["✅ Respuesta JSON al cliente"]

    style REQ fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style VALIDATION fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style AUTH fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style PERMISSIONS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style THROTTLE fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style EXECUTION fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    style ERROR fill:#ffcdd2,stroke:#b71c1c,stroke-width:2px
    style RESP fill:#c8e6c9,stroke:#1b5e20,stroke-width:2px
    style V4 fill:#ffcdd2,stroke:#b71c1c
    style A4 fill:#ffcdd2,stroke:#b71c1c
    style A6 fill:#ffcdd2,stroke:#b71c1c
    style A8 fill:#ffcdd2,stroke:#b71c1c
    style A10 fill:#ffcdd2,stroke:#b71c1c
    style P4 fill:#ffcdd2,stroke:#b71c1c
    style P11 fill:#ffcdd2,stroke:#b71c1c
    style P14 fill:#ffcdd2,stroke:#b71c1c
    style T3 fill:#ffcdd2,stroke:#b71c1c
```

---

## 2. AuthGuard — Flujo interno

```mermaid
flowchart TD
    START["🔐 AuthGuard — Inicio"] --> CHECK_PUBLIC

    subgraph STEP1["Paso 1: Verificar si es pública"]
        CHECK_PUBLIC{"reflector.getAllAndOverride<br/>('isPublic')"}
        PUBLIC_YES["✅ Ruta es pública →<br/>Deja pasar INMEDIATAMENTE"]
        PUBLIC_NO["Ruta NO es pública →<br/>Continuar verificación"]
    end

    subgraph STEP2["Paso 2: Extraer token"]
        EXTRACT["Extraer header Authorization"]
        SPLIT["Split por espacio:<br/>'Bearer eyJhbGci...'"]
        HAS_TOKEN{"¿type === 'Bearer'<br/>y token existe?"}
        NO_TOKEN["❌ throw UnauthorizedException<br/>'Token not found'"]
    end

    subgraph STEP3["Paso 3: Verificar JWT"]
        VERIFY["jwtService.verifyAsync(token,<br/>{ secret: envs.jwtSecret })"]
        JWT_VALID{"¿El token es válido<br/>y no expiró?"}
        JWT_FAIL["❌ throw UnauthorizedException<br/>'Invalid or expired token'"]
    end

    subgraph STEP4["Paso 4: Buscar usuario en BD"]
        FIND_USER["usuarioRepository.findOne({<br/>where: { id: payload.userId, activo: true },<br/>relations: ['rol', 'puesto', 'sucursal']<br/>})"]
        USER_EXISTS{"¿El usuario existe<br/>y está activo?"}
        USER_FAIL["❌ throw UnauthorizedException<br/>'User not found or inactive'"]
    end

    subgraph STEP5["Paso 5: Cargar en request"]
        CLEAN["user.clave = ''  (quitar contraseña)"]
        INJECT["request.user = user"]
        OK["✅ canActivate = true"]
    end

    START --> CHECK_PUBLIC
    CHECK_PUBLIC -->|"isPublic = true"| PUBLIC_YES
    CHECK_PUBLIC -->|"isPublic = false<br/>o undefined"| PUBLIC_NO
    PUBLIC_YES --> OK
    PUBLIC_NO --> EXTRACT
    EXTRACT --> SPLIT
    SPLIT --> HAS_TOKEN
    HAS_TOKEN -->|"No"| NO_TOKEN
    HAS_TOKEN -->|"Sí"| VERIFY
    VERIFY --> JWT_VALID
    JWT_VALID -->|"No"| JWT_FAIL
    JWT_VALID -->|"Sí"| FIND_USER
    FIND_USER --> USER_EXISTS
    USER_EXISTS -->|"No"| USER_FAIL
    USER_EXISTS -->|"Sí"| CLEAN
    CLEAN --> INJECT
    INJECT --> OK

    style START fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style STEP1 fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style STEP2 fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style STEP3 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style STEP4 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style STEP5 fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    style PUBLIC_YES fill:#c8e6c9,stroke:#1b5e20
    style OK fill:#c8e6c9,stroke:#1b5e20
    style NO_TOKEN fill:#ffcdd2,stroke:#b71c1c
    style JWT_FAIL fill:#ffcdd2,stroke:#b71c1c
    style USER_FAIL fill:#ffcdd2,stroke:#b71c1c
```

---

## 3. PermissionsGuard — Flujo interno

```mermaid
flowchart TD
    START["🔑 PermissionsGuard — Inicio"] --> CHECK_PERMS

    subgraph STEP1["Paso 1: Verificar si hay permisos requeridos"]
        CHECK_PERMS{"reflector.getAllAndOverride<br/>('requiredPermissions')"}
        NO_PERMS["La ruta NO declara permisos<br/>→ Deja pasar"]
    end

    subgraph STEP2["Paso 2: Verificar usuario autenticado"]
        CHECK_USER{"¿request.user<br/>existe?"}
        NO_USER["❌ throw UnauthorizedException<br/>'Usuario no autenticado'"]
    end

    subgraph STEP3["Paso 3: Bypass de admin"]
        CHECK_ADMIN{"¿user.rol?.esAdmin === true?"}
        ADMIN_YES["✅ Acceso TOTAL<br/>(no verifica permisos)"]
    end

    subgraph STEP4["Paso 4: Verificar cada permiso"]
        LOOP["Para cada código en<br/>requiredPermissions..."]
        FIND_PERMO["permisoRepository.findOne({<br/>where: { codigo }<br/>)"]
        PERMO_EXISTS{"¿El permiso existe<br/>en la BD?"}
        PERMO_FAIL["❌ throw InternalServerErrorException<br/>'Permiso no configurado'"]

        CHECK_EXCEP["permisoUsuarioRepository.findOne({<br/>where: { usuarioId, permisoId }<br/})"]
        HAS_EXCEP{"¿Tiene excepción<br/>individual?"}
        EXCEP_PERMITIDO{"excepcion.permitido?"}
        EXCEP_OK["✅ Excepción concede acceso<br/>→ Continuar con siguiente permiso"]
        EXCEP_DENY["❌ throw ForbiddenException<br/>'Excepción deniega permiso'"]

        CHECK_ROL["permisoRolRepository.findOne({<br/>where: { rolId, permisoId }<br/})"]
        HAS_ROL{"¿Su rol tiene<br/>el permiso?"}
        ROL_OK["✅ Permiso concedido por rol<br/>→ Continuar con siguiente permiso"]
        ROL_DENY["❌ throw ForbiddenException<br/>'Sin permiso'"]
    end

    subgraph STEP5["Paso 5: Todos los permisos validados"]
        ALL_OK["✅ canActivate = true<br/>(todos los permisos pasaron)"]
    end

    START --> CHECK_PERMS
    CHECK_PERMS -->|"undefined o []"| NO_PERMS
    CHECK_PERMS -->|"Hay permisos"| CHECK_USER
    NO_PERMS --> ALL_OK
    CHECK_USER -->|"No existe"| NO_USER
    CHECK_USER -->|"Existe"| CHECK_ADMIN
    CHECK_ADMIN -->|"Sí"| ADMIN_YES
    CHECK_ADMIN -->|"No"| LOOP
    ADMIN_YES --> ALL_OK
    LOOP --> FIND_PERMO
    FIND_PERMO --> PERMO_EXISTS
    PERMO_EXISTS -->|"No"| PERMO_FAIL
    PERMO_EXISTS -->|"Sí"| CHECK_EXCEP
    CHECK_EXCEP --> HAS_EXCEP
    HAS_EXCEP -->|"Sí"| EXCEP_PERMITIDO
    HAS_EXCEP -->|"No"| CHECK_ROL
    EXCEP_PERMITIDO -->|"true"| EXCEP_OK
    EXCEP_PERMITIDO -->|"false"| EXCEP_DENY
    EXCEP_OK --> LOOP
    CHECK_ROL --> HAS_ROL
    HAS_ROL -->|"Sí"| ROL_OK
    HAS_ROL -->|"No"| ROL_DENY
    ROL_OK --> LOOP
    LOOP -.->|"Siguiente permiso"| FIND_PERMO
    LOOP -.->|"Todos validados"| ALL_OK

    style START fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style STEP1 fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style STEP2 fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style STEP3 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style STEP4 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style STEP5 fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    style NO_PERMS fill:#c8e6c9,stroke:#1b5e20
    style ADMIN_YES fill:#c8e6c9,stroke:#1b5e20
    style EXCEP_OK fill:#c8e6c9,stroke:#1b5e20
    style ROL_OK fill:#c8e6c9,stroke:#1b5e20
    style ALL_OK fill:#c8e6c9,stroke:#1b5e20
    style NO_USER fill:#ffcdd2,stroke:#b71c1c
    style PERMO_FAIL fill:#ffcdd2,stroke:#b71c1c
    style EXCEP_DENY fill:#ffcdd2,stroke:#b71c1c
    style ROL_DENY fill:#ffcdd2,stroke:#b71c1c
```

---

## 4. AdminOnlyGuard — Flujo interno

```mermaid
flowchart TD
    START["👑 AdminOnlyGuard — Inicio"] --> CHECK

    subgraph DECISION["Decisión"]
        CHECK{"reflector.getAllAndOverride<br/>('isAdmin')"}
        NOT_ADMIN_ROUTE["La ruta NO tiene @AdminOnly()<br/>→ Deja pasar"]
        GET_USER["Obtener request.user<br/>(cargado por AuthGuard)"]
        IS_ADMIN{"¿user.rol?.esAdmin === true?"}
        ADMIN_OK["✅ canActivate = true"]
        ADMIN_FAIL["❌ throw ForbiddenException<br/>'No tienes permisos suficientes'"]
    end

    START --> CHECK
    CHECK -->|"isAdmin = false<br/>o undefined"| NOT_ADMIN_ROUTE
    CHECK -->|"isAdmin = true"| GET_USER
    GET_USER --> IS_ADMIN
    IS_ADMIN -->|"Sí"| ADMIN_OK
    IS_ADMIN -->|"No"| ADMIN_FAIL

    style START fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style DECISION fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style NOT_ADMIN_ROUTE fill:#c8e6c9,stroke:#1b5e20
    style ADMIN_OK fill:#c8e6c9,stroke:#1b5e20
    style ADMIN_FAIL fill:#ffcdd2,stroke:#b71c1c
```

---

## 5. ThrottlerGuard — Flujo interno

```mermaid
flowchart TD
    START["⏱️ ThrottlerGuard — Inicio"] --> CHECK

    subgraph RATE_CHECK["Verificación de Rate Limiting"]
        CHECK["Contar peticiones recientes<br/>por IP + ruta"]
        LIMITS["Límites configurados:<br/>short: 30 req / 1 seg<br/>medium: 300 req / 60 seg<br/>long: 1000 req / 3600 seg"]
        WITHIN{"¿Dentro del límite<br/>en TODAS las ventanas?"}
        THROTTLE["❌ 429 Too Many Requests<br/>Retry-After: X segundos"]
        PASS["✅ canActivate = true"]
    end

    START --> CHECK
    CHECK --> LIMITS
    LIMITS --> WITHIN
    WITHIN -->|"Sí"| PASS
    WITHIN -->|"No"| THROTTLE

    style START fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style RATE_CHECK fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style PASS fill:#c8e6c9,stroke:#1b5e20
    style THROTTLE fill:#ffcdd2,stroke:#b71c1c
```

---

## 6. Flujo completo de una petición

### Ejemplo: `DELETE /v1/auth/bitacora/uuid-123` (solo admin)

```mermaid
sequenceDiagram
    autonumber
    participant C as 🌐 Cliente
    participant VP as 🔍 ValidationPipe
    participant AG as 🛡️ AuthGuard
    participant PG as 🔑 PermissionsGuard
    participant AO as 👑 AdminOnlyGuard
    participant TG as ⏱️ ThrottlerGuard
    participant BC as 📋 BitacoraController
    participant BS as ⚙️ BitacoraService
    participant DB as 🗄️ SQL Server

    C->>VP: DELETE /v1/auth/bitacora/uuid-123<br/>Authorization: Bearer eyJhbGc...

    Note over VP: Validación de parámetros<br/>ParseUUIDPipe verifica que 'uuid-123'<br/>sea un UUID válido

    VP->>AG: Parámetro validado

    Note over AG: 1. ¿La ruta tiene @Public()? → No<br/>2. ¿Existe header Authorization? → Sí<br/>3. ¿Formato Bearer token? → Sí<br/>4. ¿JWT válido y no expirado? → Sí<br/>5. ¿Usuario existe y activo? → Sí<br/>6. Carga usuario en request.user

    AG->>PG: request.user = { id, userName, rol: { esAdmin: true } }

    Note over PG: 1. ¿La ruta tiene @RequirePermissions()? → No<br/>2. No hay permisos que verificar<br/>3. Deja pasar

    PG->>AO: request.user disponible

    Note over AO: 1. ¿La ruta tiene @AdminOnly()? → SÍ<br/>2. ¿user.rol.esAdmin === true? → SÍ<br/>3. Deja pasar

    AO->>TG: Admin verificado

    Note over TG: Rate limiting:<br/>¿Ha hecho >30 peticiones en 1 seg? → No<br/>Deja pasar

    TG->>BC: Todos los guards pasaron

    Note over BC: @Delete(':id')<br/>remove(id: 'uuid-123')

    BC->>BS: bitacoraService.remove('uuid-123')

    Note over BS: 1. findOneBy({ id }) → registro<br/>2. Si no existe → ERROR 404<br/>3. remove(registro) → elimina de BD

    BS->>DB: SELECT + DELETE FROM Bitacora_Autorizacion

    DB-->>BS: Registro eliminado

    BS-->>BC: customSuccessResponse(registro, 200, 'Eliminado')

    BC-->>C: { success: true, statusCode: "200",<br/>message: "Registro eliminado exitosamente" }
```

---

## 7. Jerarquía de decisión de permisos

```mermaid
flowchart TD
    START["¿El usuario quiere ejecutar<br/>un endpoint con @RequirePermissions?"]

    subgraph LEVEL1["NIVEL 1 — Admin"]
        L1{"¿user.rol.esAdmin === true?"}
        L1_YES["✅ ACCESO TOTAL<br/>No se verifica nada más"]
    end

    subgraph LEVEL2["NIVEL 2 — Excepción Individual"]
        L2["Buscar en Permiso_Usuario<br/>WHERE usuarioId = ? AND permisoId = ?"]
        L2_FOUND{"¿Existe excepción?"}
        L2_PERMIT{"excepcion.permitido === true?"}
        L2_OK["✅ ACCESO CONCEDIDO<br/>por excepción individual"]
        L2_DENY["❌ ACCESO DENEGADO<br/>excepción lo bloquea"]
    end

    subgraph LEVEL3["NIVEL 3 — Permiso del Rol"]
        L3["Buscar en Permiso_Rol<br/>WHERE rolId = ? AND permisoId = ?"]
        L3_FOUND{"¿El rol tiene<br/>el permiso?"}
        L3_OK["✅ ACCESO CONCEDIDO<br/>por rol"]
        L3_DENY["❌ ACCESO DENEGADO<br/>rol no tiene el permiso"]
    end

    START --> L1
    L1 -->|"Sí"| L1_YES
    L1 -->|"No"| L2
    L2 --> L2_FOUND
    L2_FOUND -->|"Sí"| L2_PERMIT
    L2_FOUND -->|"No"| L3
    L2_PERMIT -->|"Sí"| L2_OK
    L2_PERMIT -->|"No"| L2_DENY
    L3 --> L3_FOUND
    L3_FOUND -->|"Sí"| L3_OK
    L3_FOUND -->|"No"| L3_DENY

    style START fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style LEVEL1 fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style LEVEL2 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style LEVEL3 fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style L1_YES fill:#c8e6c9,stroke:#1b5e20
    style L2_OK fill:#c8e6c9,stroke:#1b5e20
    style L3_OK fill:#c8e6c9,stroke:#1b5e20
    style L2_DENY fill:#ffcdd2,stroke:#b71c1c
    style L3_DENY fill:#ffcdd2,stroke:#b71c1c
```

---

## 8. Relación Decorador → Guard → Guard

```mermaid
flowchart LR
    subgraph DECORATORS["📝 Los Decoradores (SetMetadata)"]
        D1["@Public()<br/>Guarda: isPublic = true"]
        D2["@AdminOnly()<br/>Guarda: isAdmin = true"]
        D3["@RequirePermissions('USR01')<br/>Guarda: requiredPermissions = ['USR01']"]
        D4["@GetUser()<br/>Extrae request.user"]
    end

    subgraph REFLECTOR["🔍 Reflector (lector de metadatos)"]
        R["NestJS Reflector<br/>Lee los metadatos<br/>guardados por los decoradores"]
    end

    subgraph GUARDS["🛡️ Los Guards (CanActivate)"]
        G1["AuthGuard<br/>Lee: isPublic<br/>¿Es ruta pública?"]
        G2["AdminOnlyGuard<br/>Lee: isAdmin<br/>¿Requiere admin?"]
        G3["PermissionsGuard<br/>Lee: requiredPermissions<br/>¿Qué permisos necesita?"]
        G4["@GetUser() param<br/>Lee: request.user<br/>¿Quién es el usuario?"]
    end

    DECORATORS -->|"Guardan metadatos"| REFLECTOR
    REFLECTOR -->|"Lee metadatos"| GUARDS

    D1 -->|"lee 'isPublic'"| G1
    D2 -->|"lee 'isAdmin'"| G2
    D3 -->|"lee 'requiredPermissions'"| G3
    D4 -->|"extrae request.user"| G4

    style DECORATORS fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style REFLECTOR fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style GUARDS fill:#fce4ec,stroke:#c62828,stroke-width:2px
```

### Ejemplo concreto: Cómo un decorador controla un guard

```mermaid
sequenceDiagram
    autonumber
    participant Dev as 👨‍💻 Desarrollador
    participant Code as 📝 Código TypeScript
    participant NestJS as 🏗️ NestJS Framework
    participant Guard as 🛡️ AdminOnlyGuard

    Dev->>Code: Escribe @AdminOnly() en un endpoint

    Note over Code: AdminOnly() ejecuta<br/>SetMetadata('isAdmin', true)<br/>Guarda el dato en metadatos del método

    Code->>NestJS: Registra el endpoint con sus metadatos

    Note over NestJS: Cuando alguien llama al endpoint,<br/>NestJS ejecuta los guards en orden

    NestJS->>Guard: reflector.getAllAndOverride('isAdmin', [...])

    Note over Guard: Lee: isAdmin = true<br/>→ Verifica que el usuario sea admin

    Guard-->>NestJS: true (es admin) o false (no es admin)
    NestJS-->>Code: Si true → ejecuta el handler<br/>Si false → lanza 403
```

---

## 9. Flujo de Login y generación de JWT

```mermaid
sequenceDiagram
    autonumber
    participant C as 🌐 Cliente
    participant AG as 🛡️ AuthGuard
    participant AC as 📋 AuthController
    participant AS as ⚙️ AuthService
    participant DB as 🗄️ SQL Server
    participant JWT as 🔑 JwtService

    C->>AG: POST /v1/auth/login<br/>{ userName: "sysadmin", password: "S3gura!2026" }

    Note over AG: 1. ¿La ruta tiene @Public()? → SÍ<br/>2. Deja pasar sin verificar token

    AG->>AC: request pasa sin autenticación

    AC->>AS: authService.login({ userName, password })

    AS->>DB: findOne({ where: { userName: "sysadmin", activo: true },<br/>relations: ['rol', 'sucursal'] })

    DB-->>AS: { id: "uuid-123", userName: "sysadmin",<br/>clave: "$2b$10$...", rol: { id: "uuid-rol", esAdmin: true } }

    Note over AS: bcrypt.compareSync(password, user.clave)<br/>Compara la contraseña hasheada

    AS->>JWT: jwtService.sign({ userId, userName, rolId, email, fullName })

    Note over JWT: Genera token JWT con:<br/>- Payload: datos del usuario<br/>- Firma: con jwtSecret<br/>- Expiración: TOKEN_EXPIRATION segundos

    JWT-->>AS: "eyJhbGciOiJIUzI1NiIs..."

    AS-->>AC: { user: { ...sin clave }, token: "eyJhbGci..." }

    AC-->>C: { success: true,<br/>data: { user: {...}, token: "eyJhbGci..." } }

    Note over C: Guarda el token.<br/>Lo envía en cada petición subsiguiente:<br/>Authorization: Bearer eyJhbGci...
```

---

## 10. Flujo del módulo Storage con guards

```mermaid
flowchart TD
    REQ["🌐 POST /v1/storage/upload/perfil<br/>Headers: Authorization, Content-Type: multipart/form-data<br/>Body: archivo + customName"]

    subgraph GLOBAL["🛡️ Guards Globales (app.module.ts)"]
        G1["AuthGuard → Verifica token JWT"]
        G2["PermissionsGuard → No tiene @RequirePermissions → OK"]
        G3["ThrottlerGuard → Rate limiting"]
    end

    subgraph CONTROLLER_GUARDS["🔒 Guards del Controller"]
        CG1["@UseGuards(AuthGuard)<br/>(redundante, ya es global)"]
        CG2["@UseGuards(CategoryAccessGuard)<br/>(solo en upload)"]
    end

    subgraph CATEGORY_GUARD["📁 CategoryAccessGuard"]
        CA1{"¿La categoría<br/>'perfil' existe en<br/>CATEGORY_CONFIG?"}
        CA2["❌ ForbiddenException<br/>'Categoría inválida'"]
        CA3{"¿config.requiresAdmin?"}
        CA4{"¿user.rol.nombre === 'Admin'?"}
        CA5["✅ Acceso permitido"]
        CA6["❌ ForbiddenException<br/>'Solo administradores'"]
    end

    subgraph INTERCEPTOR["📝 FileLoggingInterceptor"]
        IL["Registra: operación, categoría,<br/>nombre archivo, usuario, duración"]
    end

    subgraph MULTER["📎 Multer (FileInterceptor)"]
        MF["Extrae el archivo del<br/>body multipart/form-data"]
        MF_LIMIT["Límite: 50 MB<br/>(MulterModule.register)"]
    end

    subgraph SERVICE["⚙️ StorageService"]
        SV1["FileValidationService.validateMimeType()"]
        SV2["FileValidationService.validateExtension()"]
        SV3["MagicNumberValidator.validate()"]
        SV4["AntivirusService.scanFile() (placeholder)"]
        SV5["FilenameSanitizer.sanitize()"]
        SV6["Copiar a uploads/perfil/"]
        SV7["EntityUpdaterService.updateEntityUrl()<br/>Actualiza usuario.fotoUrl"]
    end

    REQ --> G1 --> G2 --> G3
    G3 --> CG1 --> CG2
    CG2 --> CA1
    CA1 -->|"No"| CA2
    CA1 -->|"Sí"| CA3
    CA3 -->|"No"| CA5
    CA3 -->|"Sí"| CA4
    CA4 -->|"Sí"| CA5
    CA4 -->|"No"| CA6
    CA5 --> IL
    IL --> MF
    MF --> MF_LIMIT
    MF_LIMIT --> SV1
    SV1 --> SV2 --> SV3 --> SV4 --> SV5 --> SV6 --> SV7
    SV7 --> RESP["✅ Respuesta: URL del archivo subido"]

    CA2 --> ERROR["🚫 HttpCustomExceptionFilter"]
    CA6 --> ERROR
    SV1 -.->|"Error"| ERROR
    SV2 -.->|"Error"| ERROR
    SV3 -.->|"Error"| ERROR

    style REQ fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style GLOBAL fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style CONTROLLER_GUARDS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style CATEGORY_GUARD fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    style INTERCEPTOR fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style MULTER fill:#e0f7fa,stroke:#00838f,stroke-width:2px
    style SERVICE fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    style RESP fill:#c8e6c9,stroke:#1b5e20
    style ERROR fill:#ffcdd2,stroke:#b71c1c
    style CA2 fill:#ffcdd2,stroke:#b71c1c
    style CA6 fill:#ffcdd2,stroke:#b71c1c
```

---

## 📊 Resumen de todos los Guards

```mermaid
graph TD
    subgraph GLOBAL["🌍 Guards Globales (app.module.ts)"]
        direction LR
        G_A["🛡️ AuthGuard<br/>Verifica: Token JWT<br/>Archivo: auth.guard.ts<br/>Error: 401"]
        G_P["🔑 PermissionsGuard<br/>Verifica: Permisos del rol/usuario<br/>Archivo: permissions.guard.ts<br/>Error: 403"]
        G_T["⏱️ ThrottlerGuard<br/>Verifica: Rate limiting<br/>Paquete: @nestjs/throttler<br/>Error: 429"]
    end

    subgraph LOCAL["📍 Guards Locales (@UseGuards)"]
        direction LR
        G_AO["👑 AdminOnlyGuard<br/>Verifica: Rol esAdmin<br/>Archivo: admin-only.guard.ts<br/>Error: 403"]
        G_AK["🗝️ ApiKeyGuard<br/>Verifica: Header apikey<br/>Archivo: api-key.guard.ts<br/>Error: 401"]
        G_CA["📁 CategoryAccessGuard<br/>Verifica: Acceso por categoría<br/>Archivo: category-access.guard.ts<br/>Error: 403"]
    end

    GLOBAL -->|"Se ejecutan en TODAS las rutas"| ROUTES["🚀 Todos los endpoints"]
    LOCAL -->|"Se ejecutan solo en<br/>rutas específicas"| SPECIFIC["📌 Endpoints marcados"]

    style GLOBAL fill:#fce4ec,stroke:#c62828,stroke-width:2px
    style LOCAL fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style ROUTES fill:#e3f2fd,stroke:#1565c0
    style SPECIFIC fill:#fff3e0,stroke:#ef6c00
```

---

## 🧠 Leyenda de colores

| Color | Significado |
|---|---|
| 🔵 Azul claro | Petición inicial o punto de partida |
| 🔴 Rojo claro | Guards de autenticación/seguridad |
| 🟣 Púrpura | Guards de permisos/autorización |
| 🟢 Verde claro | Rate limiting o éxito |
| 🟠 Naranja | Validación o categorías |
| 🟡 Amarillo | Excepciones y errores |
| 🟢 Verde fuerte | Respuesta exitosa |

---

## 📁 Archivos de referencia

| Guard | Archivo | Tipo |
|---|---|---|
| AuthGuard | `src/common/guards/auth.guard.ts` | Global |
| PermissionsGuard | `src/common/guards/permissions.guard.ts` | Global |
| AdminOnlyGuard | `src/common/guards/admin-only.guard.ts` | Local |
| ApiKeyGuard | `src/common/guards/api-key.guard.ts` | Local |
| CategoryAccessGuard | `src/storage/guards/category-access.guard.ts` | Local |
| ThrottlerGuard | Paquete `@nestjs/throttler` | Global |
| HttpCustomExceptionFilter | `src/common/exceptions/http-custom-exception.filter.ts` | Global |
