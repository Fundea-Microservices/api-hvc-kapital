/* 1. Configuración inicial */
SET FOREIGN_KEY_CHECKS = 0; -- Desactiva revisión de llaves foráneas para poder borrar tablas sin error
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

/* 2. Creación de la Base de Datos (Equivalente al Schema auth) */
CREATE DATABASE IF NOT EXISTS HvcKapital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE HvcKapital;

/* 3. Limpieza de tablas previas */
DROP TABLE IF EXISTS Permiso_Usuario;
DROP TABLE IF EXISTS Permiso_Rol;
DROP TABLE IF EXISTS Permiso;
DROP TABLE IF EXISTS Config;
DROP TABLE IF EXISTS Acceso;
DROP TABLE IF EXISTS Menu;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS Puesto;
DROP TABLE IF EXISTS sucursal;
DROP TABLE IF EXISTS Rol;
DROP TABLE IF EXISTS `Keys`;

/* 4. Creación de Tablas */

CREATE TABLE Config (
    id CHAR(36) NOT NULL PRIMARY KEY,
    llave VARCHAR(50) NOT NULL UNIQUE,
    valor LONGTEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descripcion VARCHAR(300),
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE Rol (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    invitado TINYINT(1) NOT NULL DEFAULT 0,
    esAdmin TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE Puesto (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE Usuario (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombreCompleto VARCHAR(250) NOT NULL,
    userName VARCHAR(50) NOT NULL UNIQUE,
    nombre1 VARCHAR(50) NOT NULL,
    nombre2 VARCHAR(50) NULL,
    nombre3 VARCHAR(50) NULL,
    apellido1 VARCHAR(50) NOT NULL,
    apellido2 VARCHAR(50) NULL,
    apellido3 VARCHAR(50) NULL,
    documento VARCHAR(30) NULL,
    tipoDocumento VARCHAR(10) NULL,
    clave VARCHAR(200) NOT NULL,
    correo VARCHAR(60) NOT NULL UNIQUE,
    fotoUrl VARCHAR(350) NULL,
    lastPasswordUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
    huella TEXT,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    rolId CHAR(36),
    puestoId CHAR(36) NULL,
    sucursalId CHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE Menu (
    id CHAR(36) NOT NULL PRIMARY KEY,
    label VARCHAR(30) NOT NULL,
    descripcion VARCHAR(255),
    pathApp VARCHAR(100) NULL,
    pathWeb VARCHAR(100) NULL,
    icono VARCHAR(80) NOT NULL,
    color VARCHAR(30) NULL,
    principal TINYINT(1) NOT NULL DEFAULT 1,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE Acceso (
    id CHAR(36) NOT NULL PRIMARY KEY,
    ordenMenu INTEGER NOT NULL,
    showApp TINYINT(1) NOT NULL DEFAULT 1,
    showWeb TINYINT(1) NOT NULL DEFAULT 1,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    menuId CHAR(36) NOT NULL,
    rolId CHAR(36) NOT NULL,
    mainMenuId CHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE `Keys` (
    id CHAR(36) NOT NULL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(250) NOT NULL,
    valor BINARY(32) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE `sucursal` (
  id char(36) NOT NULL PRIMARY KEY,
  nombre varchar(150) NOT NULL,
  municipio varchar(100) NOT NULL,
  departamento varchar(100) NOT NULL,
  telefono varchar(20) DEFAULT NULL,
  direccion varchar(255) DEFAULT NULL,
  central tinyint(1) NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT current_timestamp()
);

/* 5. Tablas de Permisos (API) */

CREATE TABLE Permiso (
    id CHAR(36) NOT NULL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, /* Ej: 'PRO01', 'PRO02' */
    modulo VARCHAR(50) NOT NULL,        /* Ej: 'Inventario' */
    accion VARCHAR(50) NOT NULL,        /* Ej: 'CREAR', 'LEER', 'EDITAR', 'ELIMINAR' */
    descripcion VARCHAR(250),           /* Ej: 'Permite crear un nuevo producto' */
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

/* Relación Muchos a Muchos: Un rol tiene muchos permisos */
CREATE TABLE Permiso_Rol (
    rolId CHAR(36) NOT NULL,
    permisoId CHAR(36) NOT NULL,
    PRIMARY KEY (rolId, permisoId),
    CONSTRAINT fk_permiso_rol_rol FOREIGN KEY (rolId) REFERENCES Rol (id) ON DELETE CASCADE,
    CONSTRAINT fk_permiso_rol_permiso FOREIGN KEY (permisoId) REFERENCES Permiso (id) ON DELETE CASCADE
);

/* OPCIONAL: Tabla de Excepciones por Usuario (El modelo híbrido) */
CREATE TABLE Permiso_Usuario (
    usuarioId CHAR(36) NOT NULL,
    permisoId CHAR(36) NOT NULL,
    permitido TINYINT(1) NOT NULL DEFAULT 1, /* 1 = Otorga el permiso, 0 = Deniega el permiso (sobrescribe al rol) */
    PRIMARY KEY (usuarioId, permisoId),
    CONSTRAINT fk_permiso_user_user FOREIGN KEY (usuarioId) REFERENCES Usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_permiso_user_permiso FOREIGN KEY (permisoId) REFERENCES Permiso (id) ON DELETE CASCADE
);

/* 6. Llaves Foráneas */

ALTER TABLE Usuario ADD CONSTRAINT user_roles FOREIGN KEY (rolId) REFERENCES Rol (id);
ALTER TABLE Usuario ADD CONSTRAINT user_sucursal FOREIGN KEY (sucursalId) REFERENCES sucursal (id);
ALTER TABLE Usuario ADD CONSTRAINT user_puesto FOREIGN KEY (puestoId) REFERENCES Puesto (id);
ALTER TABLE Acceso ADD CONSTRAINT acceso_rol FOREIGN KEY (rolId) REFERENCES Rol (id);
ALTER TABLE Acceso ADD CONSTRAINT acceso_menu FOREIGN KEY (menuId) REFERENCES Menu (id);

/* 7. SEEDS (Datos de prueba) */

-- Definición de variables en MySQL
SET @rolAdm = 'e6e4b01c-5e2b-4d59-9a8e-6bfb8d32d7a1';
SET @rolOpera = '3f46a1f3-1b4d-4b28-bc23-6f1c7ab9e67d';
SET @rolInvitado = '9a7317f7-2b7c-45b2-99e1-47c61a6d8a5f';
SET @sucGeneral = 'b1d2c3e4-5f6a-4b7c-8d9e-0a1b2c3d4e5f';
SET @puestoAdmin = 'c2e3d4f5-6a7b-4c8d-9e0f-1a2b3c4d5e6f';
SET @usrAdmin = 'd3f4e5a6-7b8c-4d9e-0f1a-2b3c4d5e6f7a';

INSERT INTO Rol (id, nombre, invitado, esAdmin) VALUES (@rolAdm, 'Administrador', 0, 1);
INSERT INTO Rol (id, nombre, invitado, esAdmin) VALUES (@rolOpera, 'Operador', 0, 0);
INSERT INTO Rol (id, nombre, invitado, esAdmin) VALUES (@rolInvitado, 'Invitado', 1, 0);

-- Sucursal y puesto por defecto
INSERT INTO sucursal (id, nombre, municipio, departamento, central) VALUES (@sucGeneral, 'GENERAL', 'Guatemala', 'Guatemala', 1);
INSERT INTO Puesto (id, nombre, activo) VALUES (@puestoAdmin, 'Administrador', 1);

-- Insertar Usuario (con ID fijo para poder asignarle sucursal y puesto)
INSERT INTO Usuario (id, nombreCompleto, userName, correo, clave, nombre1, apellido1, apellido2, rolId, puestoId, sucursalId)
VALUES (@usrAdmin, 'Administrador del sistema', 'sysadmin', 'admindtd@gmail.com', '$2b$10$i9bq23.nmQ1YM/bp1REvr.Jiuu48V5nem/NmxkFszsRPzlOPp6vly', 'Administrador', 'General', 'Sistema', @rolAdm, @puestoAdmin, @sucGeneral);

-- Variable para el menú de configuración
SET @menConfig = 'a328a6c4-bf37-4e9c-8619-d27f83c7e6ec';

INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES (@menConfig, 'Configuración', 'Configuración de roles, usuarios, menús y accesos', 'config', '/config', 'settings', 'black', 1);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('49b66f96-ff63-4cb9-b0e3-d3c0048e2a44', 'Usuarios', 'Manejo de usuarios', '/config/usuarios', '/config/usuarios', 'circle-user-round', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('fd4290c9-dccb-41c5-90a1-2d0a0d1381a4', 'Roles', 'Manejo de roles', '/config/roles', '/config/roles', 'user-check', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('f42f0e87-0c7c-4c12-8b4a-0197fe19bc9f', 'Menus', 'Manejo de los menús', '/config/menus', '/config/menus', 'menu', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('5f3c574f-6ed8-4512-bb78-e18409f1e160', 'Accesos', 'Manejo de los accesos por rol', '/config/accesos', '/config/accesos', 'user-lock', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('e17c1d08-ff07-4c96-b4f4-9295d4c9893c', 'Configuraciones', 'Variables generales', '/config/general', '/config/general', 'settings', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('3f9d5b1b-0c57-4f60-982d-1c1a6b998c37', 'Puestos', 'Puestos de los usuarios', '/config/puestos', '/config/puestos', 'users', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Sucursales', 'Sucursales', '/config/sucursales', '/config/sucursales', 'store', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('31df4276-b38d-4ac8-9270-2466e509b3d9', 'Permisos', 'Permisos', '/config/permisos', '/config/permisos', 'lock', 'black', 0);
INSERT INTO Menu (id, label, descripcion, pathApp, pathWeb, icono, color, principal) VALUES ('b584c48d-c624-403a-9743-db10d38b86f7', 'Permisos - Rol', 'Permisos por rol', '/config/permisos-rol', '/config/permisos-rol', 'lock', 'black', 0);

-- Accesos (Nota: Se usa UUID() para generar el ID de acceso)
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 1, 1, 1, 1, @menConfig, @rolAdm, NULL);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 1, 1, 1, 1, '49b66f96-ff63-4cb9-b0e3-d3c0048e2a44', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 2, 1, 1, 1, 'fd4290c9-dccb-41c5-90a1-2d0a0d1381a4', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 3, 1, 1, 1, 'f42f0e87-0c7c-4c12-8b4a-0197fe19bc9f', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 4, 1, 1, 1, '5f3c574f-6ed8-4512-bb78-e18409f1e160', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 5, 1, 1, 1, 'e17c1d08-ff07-4c96-b4f4-9295d4c9893c', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 6, 1, 1, 1, '3f9d5b1b-0c57-4f60-982d-1c1a6b998c37', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 7, 1, 1, 1, 'f47ac10b-58cc-4372-a567-0e02b2c3d479', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 8, 1, 1, 1, '31df4276-b38d-4ac8-9270-2466e509b3d9', @rolAdm, @menConfig);
INSERT INTO Acceso (id, ordenMenu, showApp, showWeb, activo, menuId, rolId, mainMenuId) VALUES (UUID(), 9, 1, 1, 1, 'b584c48d-c624-403a-9743-db10d38b86f7', @rolAdm, @menConfig);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1; -- Vuelve a activar las restricciones
