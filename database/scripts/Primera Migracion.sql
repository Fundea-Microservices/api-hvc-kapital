-- DROP SCHEMA auth;

CREATE SCHEMA auth;
-- [hvc-db].auth.Config definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Config;

CREATE TABLE [hvc-db].auth.Config (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	llave nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	valor nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tipo nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	descripcion nvarchar(300) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	activo bit DEFAULT 1 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	CONSTRAINT PK__Config__3213E83F6ABCE214 PRIMARY KEY (id),
	CONSTRAINT UQ__Config__B8B4879E9C7AAC46 UNIQUE (llave)
);


-- [hvc-db].auth.Keys definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Keys;

CREATE TABLE [hvc-db].auth.Keys (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	nombre nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	descripcion nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	valor binary(32) NOT NULL,
	activo bit DEFAULT 1 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	CONSTRAINT PK__Keys__3213E83F919015B5 PRIMARY KEY (id)
);


-- [hvc-db].auth.Menu definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Menu;

CREATE TABLE [hvc-db].auth.Menu (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	label nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	descripcion nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pathApp nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pathWeb nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	icono nvarchar(80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	color nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	principal bit DEFAULT 1 NOT NULL,
	activo bit DEFAULT 1 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	CONSTRAINT PK__Menu__3213E83F6DF54904 PRIMARY KEY (id)
);


-- [hvc-db].auth.Permiso definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Permiso;

CREATE TABLE [hvc-db].auth.Permiso (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	codigo nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	modulo nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	accion nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	descripcion nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	activo bit DEFAULT 1 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	requires_auth bit DEFAULT 0 NOT NULL,
	CONSTRAINT PK__Permiso__3213E83FE3D7DF50 PRIMARY KEY (id),
	CONSTRAINT UQ__Permiso__40F9A20674E95DD7 UNIQUE (codigo)
);


-- [hvc-db].auth.Puesto definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Puesto;

CREATE TABLE [hvc-db].auth.Puesto (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	nombre nvarchar(80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	activo bit DEFAULT 1 NOT NULL,
	CONSTRAINT PK__Puesto__3213E83FCE8505C0 PRIMARY KEY (id)
);


-- [hvc-db].auth.Rol definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Rol;

CREATE TABLE [hvc-db].auth.Rol (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	nombre nvarchar(80) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	activo bit DEFAULT 1 NOT NULL,
	invitado bit DEFAULT 0 NOT NULL,
	esAdmin bit DEFAULT 0 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	CONSTRAINT PK__Rol__3213E83F1B452945 PRIMARY KEY (id)
);


-- [hvc-db].auth.sucursal definition

-- Drop table

-- DROP TABLE [hvc-db].auth.sucursal;

CREATE TABLE [hvc-db].auth.sucursal (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	nombre nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	municipio nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	departamento nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	telefono nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	direccion nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	central bit DEFAULT 0 NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	CONSTRAINT PK__sucursal__3213E83F2F8AF173 PRIMARY KEY (id)
);


-- [hvc-db].auth.Acceso definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Acceso;

CREATE TABLE [hvc-db].auth.Acceso (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	ordenMenu int NOT NULL,
	showApp bit DEFAULT 1 NOT NULL,
	showWeb bit DEFAULT 1 NOT NULL,
	activo bit DEFAULT 1 NOT NULL,
	menuId uniqueidentifier NOT NULL,
	rolId uniqueidentifier NOT NULL,
	mainMenuId uniqueidentifier NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	CONSTRAINT PK__Acceso__3213E83FC50F6AD6 PRIMARY KEY (id),
	CONSTRAINT acceso_menu FOREIGN KEY (menuId) REFERENCES [hvc-db].auth.Menu(id),
	CONSTRAINT acceso_rol FOREIGN KEY (rolId) REFERENCES [hvc-db].auth.Rol(id)
);


-- [hvc-db].auth.Permiso_Rol definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Permiso_Rol;

CREATE TABLE [hvc-db].auth.Permiso_Rol (
	rolId uniqueidentifier NOT NULL,
	permisoId uniqueidentifier NOT NULL,
	autoriza bit DEFAULT 0 NOT NULL,
	CONSTRAINT PK__Permiso___5639646175A04F89 PRIMARY KEY (rolId,permisoId),
	CONSTRAINT FK_PermisoRol_Permiso FOREIGN KEY (permisoId) REFERENCES [hvc-db].auth.Permiso(id) ON DELETE CASCADE,
	CONSTRAINT FK_PermisoRol_Rol FOREIGN KEY (rolId) REFERENCES [hvc-db].auth.Rol(id) ON DELETE CASCADE
);


-- [hvc-db].auth.Usuario definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Usuario;

CREATE TABLE [hvc-db].auth.Usuario (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	nombreCompleto nvarchar(250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	userName nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nombre1 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nombre2 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	nombre3 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	apellido1 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	apellido2 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	apellido3 nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	documento nvarchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tipoDocumento nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	clave nvarchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	correo nvarchar(60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	fotoUrl nvarchar(350) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lastPasswordUpdate datetime DEFAULT getdate() NULL,
	huella text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	activo bit DEFAULT 1 NOT NULL,
	rolId uniqueidentifier NULL,
	puestoId uniqueidentifier NULL,
	sucursalId uniqueidentifier NULL,
	created_at datetime DEFAULT getdate() NULL,
	updated_at datetime NULL,
	deleted_at datetime NULL,
	auth_code nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	autoriza bit DEFAULT 0 NOT NULL,
	CONSTRAINT PK__Usuario__3213E83FE27D42A6 PRIMARY KEY (id),
	CONSTRAINT UQ__Usuario__2A586E0B7882F018 UNIQUE (correo),
	CONSTRAINT UQ__Usuario__66DCF95C6FBEBAB0 UNIQUE (userName),
	CONSTRAINT user_puesto FOREIGN KEY (puestoId) REFERENCES [hvc-db].auth.Puesto(id),
	CONSTRAINT user_roles FOREIGN KEY (rolId) REFERENCES [hvc-db].auth.Rol(id),
	CONSTRAINT user_sucursal FOREIGN KEY (sucursalId) REFERENCES [hvc-db].auth.sucursal(id)
);
 CREATE UNIQUE NONCLUSTERED INDEX UQ_Usuario_auth_code ON hvc-db.auth.Usuario (  auth_code ASC  )  
	 WHERE  ([auth_code] IS NOT NULL)
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- [hvc-db].auth.Bitacora_Autorizacion definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Bitacora_Autorizacion;

CREATE TABLE [hvc-db].auth.Bitacora_Autorizacion (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	endpoint nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	metodo_http nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	body_request nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	solicitanteId uniqueidentifier NOT NULL,
	autorizadorId uniqueidentifier NOT NULL,
	permisoId uniqueidentifier NOT NULL,
	created_at datetime DEFAULT getdate() NULL,
	CONSTRAINT PK__Bitacora__3213E83F473452BF PRIMARY KEY (id),
	CONSTRAINT bit_auth_autorizador FOREIGN KEY (autorizadorId) REFERENCES [hvc-db].auth.Usuario(id),
	CONSTRAINT bit_auth_permiso FOREIGN KEY (permisoId) REFERENCES [hvc-db].auth.Permiso(id),
	CONSTRAINT bit_auth_solicitante FOREIGN KEY (solicitanteId) REFERENCES [hvc-db].auth.Usuario(id)
);


-- [hvc-db].auth.Permiso_Usuario definition

-- Drop table

-- DROP TABLE [hvc-db].auth.Permiso_Usuario;

CREATE TABLE [hvc-db].auth.Permiso_Usuario (
	usuarioId uniqueidentifier NOT NULL,
	permisoId uniqueidentifier NOT NULL,
	permitido bit DEFAULT 1 NOT NULL,
	autoriza bit DEFAULT 0 NOT NULL,
	CONSTRAINT PK__Permiso___A78AF9DB59B79225 PRIMARY KEY (usuarioId,permisoId),
	CONSTRAINT FK_PermisoUser_Permiso FOREIGN KEY (permisoId) REFERENCES [hvc-db].auth.Permiso(id) ON DELETE CASCADE,
	CONSTRAINT FK_PermisoUser_User FOREIGN KEY (usuarioId) REFERENCES [hvc-db].auth.Usuario(id) ON DELETE CASCADE
);

INSERT INTO [hvc-db].auth.Acceso (id,ordenMenu,showApp,showWeb,activo,menuId,rolId,mainMenuId,created_at,updated_at,deleted_at) VALUES
	 (N'B88EF61A-2C6A-4A66-BBE9-28AFC0D91E3A',5,1,1,1,N'E17C1D08-FF07-4C96-B4F4-9295D4C9893C',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.81',NULL,NULL),
	 (N'43C75BA9-6CBC-4E74-98F9-3584CA5819E8',2,1,1,1,N'FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.79',NULL,NULL),
	 (N'FAA681A2-0028-44FF-99AD-363F651CF3C9',3,1,1,1,N'F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.797',NULL,NULL),
	 (N'93BF8560-4E82-4796-9273-42C014F525A8',4,1,1,1,N'5F3C574F-6ED8-4512-BB78-E18409F1E160',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.8',NULL,NULL),
	 (N'6DC1B85D-67D0-40CA-895C-43727DD9EF4B',8,1,1,1,N'31DF4276-B38D-4AC8-9270-2466E509B3D9',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.833',NULL,NULL),
	 (N'D20302E9-6D33-47C7-8162-63E68AD5E64F',9,1,1,1,N'B584C48D-C624-403A-9743-DB10D38B86F7',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.84',NULL,NULL),
	 (N'6A3EF19B-1233-4A27-838C-7ACDF59482A2',7,1,1,1,N'F47AC10B-58CC-4372-A567-0E02B2C3D479',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.83',NULL,NULL),
	 (N'DCD5D1CA-DDC1-4E98-899F-8C934BBD56BB',6,1,1,1,N'3F9D5B1B-0C57-4F60-982D-1C1A6B998C37',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.827',NULL,NULL),
	 (N'2EE85342-7641-4E5A-BC4A-9ED84F341C5C',1,1,1,1,N'49B66F96-FF63-4CB9-B0E3-D3C0048E2A44',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC','2026-08-17 20:53:50.783',NULL,NULL),
	 (N'99B437EF-0721-4F09-A20B-CEEA6138C321',1,1,1,1,N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC',N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',NULL,'2026-08-17 20:53:50.773',NULL,NULL);
INSERT INTO [hvc-db].auth.Config (id,llave,valor,tipo,descripcion,activo,created_at,updated_at,deleted_at) VALUES
	 (N'ED737CE7-A1CD-4E83-8A77-F177DAFA0300',N'DIAS_VENCIMIENTO_CLAVE',N'90',N'number',N'Días que transcurren antes de exigir cambio de contraseña.',1,'2026-08-28 16:15:37.703',NULL,NULL);
INSERT INTO [hvc-db].auth.Keys (id,nombre,descripcion,valor,activo,created_at,updated_at,deleted_at) VALUES
	 (N'E90F144E-2EB4-4B98-9A52-40440BF19146',N'Integración ERP',N'Llave usada por el ERP para sincronizar catálogos cada noche.',0xAA8F9415004E3D7033D37A16E2DDCF0894F4B5D9C0FF3B0A77B9398AA572149C,1,'2026-08-28 16:15:30.51',NULL,NULL);
INSERT INTO [hvc-db].auth.Menu (id,label,descripcion,pathApp,pathWeb,icono,color,principal,activo,created_at,updated_at,deleted_at) VALUES
	 (N'F42F0E87-0C7C-4C12-8B4A-0197FE19BC9F',N'Menus',N'Manejo de los menús',N'/config/menus',N'/config/menus',N'menu',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL),
	 (N'F47AC10B-58CC-4372-A567-0E02B2C3D479',N'Sucursales',N'Sucursales',N'/config/sucursales',N'/config/sucursales',N'store',N'white',0,1,'2026-08-17 20:53:50.77',NULL,NULL),
	 (N'3F9D5B1B-0C57-4F60-982D-1C1A6B998C37',N'Puestos',N'Puestos de los usuarios',N'/config/puestos',N'/config/puestos',N'users',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL),
	 (N'31DF4276-B38D-4AC8-9270-2466E509B3D9',N'Permisos',N'Permisos',N'/config/permisos',N'/config/permisos',N'lock',N'white',0,1,'2026-08-17 20:53:50.77',NULL,NULL),
	 (N'FD4290C9-DCCB-41C5-90A1-2D0A0D1381A4',N'Roles',N'Manejo de roles',N'/config/roles',N'/config/roles',N'user-check',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL),
	 (N'E17C1D08-FF07-4C96-B4F4-9295D4C9893C',N'Configuraciones',N'Variables generales',N'/config/general',N'/config/general',N'settings',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL),
	 (N'A328A6C4-BF37-4E9C-8619-D27F83C7E6EC',N'Configuración',N'Configuración de roles, usuarios, menús y accesos',N'config',N'/config',N'settings',N'white',1,1,'2026-08-17 20:53:50.76',NULL,NULL),
	 (N'49B66F96-FF63-4CB9-B0E3-D3C0048E2A44',N'Usuarios',N'Manejo de usuarios',N'/config/usuarios',N'/config/usuarios',N'circle-user-round',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL),
	 (N'B584C48D-C624-403A-9743-DB10D38B86F7',N'Permisos - Rol',N'Permisos por rol',N'/config/permisos-rol',N'/config/permisos-rol',N'lock',N'white',0,1,'2026-08-17 20:53:50.77',NULL,NULL),
	 (N'5F3C574F-6ED8-4512-BB78-E18409F1E160',N'Accesos',N'Manejo de los accesos por rol',N'/config/accesos',N'/config/accesos',N'user-lock',N'white',0,1,'2026-08-17 20:53:50.767',NULL,NULL);
INSERT INTO [hvc-db].auth.Permiso (id,codigo,modulo,accion,descripcion,activo,created_at,updated_at,requires_auth) VALUES
	 (N'8A57A8A0-6899-4EAF-97A9-CC5AB854A716',N'USR_CREAR',N'usuarios',N'CREAR',N'Permite crear nuevos usuarios',1,'2026-08-28 16:15:45.25','2026-08-28 16:48:17.97',1);
INSERT INTO [hvc-db].auth.Puesto (id,nombre,activo) VALUES
	 (N'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F',N'Administrador',1),
	 (N'1BC05894-A92B-41C5-97A2-9DFABCF7D852',N'Administrador General',1);
INSERT INTO [hvc-db].auth.Rol (id,nombre,activo,invitado,esAdmin,created_at,updated_at,deleted_at) VALUES
	 (N'9A7317F7-2B7C-45B2-99E1-47C61A6D8A5F',N'Invitado',1,1,0,'2026-08-17 20:53:50.707',NULL,NULL),
	 (N'3309409C-E0F2-473C-8F45-5862F5C468BE',N'Rol Nuevo',1,0,0,'2026-08-21 15:30:28.427',NULL,NULL),
	 (N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'Administrador',1,0,1,'2026-08-17 20:53:50.673',NULL,NULL),
	 (N'3F46A1F3-1B4D-4B28-BC23-6F1C7AB9E67D',N'Operador',1,0,0,'2026-08-17 20:53:50.693',NULL,NULL),
	 (N'411E1007-F97D-4C76-B710-BFC9BD4810E0',N'Administrador',1,0,0,'2026-08-28 16:15:14.34',NULL,NULL);
INSERT INTO [hvc-db].auth.Usuario (id,nombreCompleto,userName,nombre1,nombre2,nombre3,apellido1,apellido2,apellido3,documento,tipoDocumento,clave,correo,fotoUrl,lastPasswordUpdate,huella,activo,rolId,puestoId,sucursalId,created_at,updated_at,deleted_at,auth_code,autoriza) VALUES
	 (N'4A7E5179-48BF-4A45-8A5F-27E276AF1756',N'Administrador 1',N'admin1',N'Admin',NULL,NULL,N'Auxiliar',N'Sistema',NULL,NULL,NULL,N'$2b$10$7m7nJZNzMqtXoXuU2bq0b.E11v3kcvp3eDJWTj0MAhbRCtHA2vuAG',N'admin.auxiliar@hvc.com',N'storage/perfil/admin1-1787326762011.jpg','2026-08-26 18:52:48.0',NULL,1,N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F',N'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F','2026-08-21 14:57:05.013','2026-08-26 18:52:48.903',NULL,NULL,0),
	 (N'D3F4E5A6-7B8C-4D9E-0F1A-2B3C4D5E6F7A',N'Administrador del sistema',N'sysadmin',N'Administrador',NULL,NULL,N'General',N'Sistema',NULL,NULL,NULL,N'contraseña123',N'admindtd@gmail.com',NULL,'2026-08-17 20:53:50.737',NULL,1,N'E6E4B01C-5E2B-4D59-9A8E-6BFB8D32D7A1',N'C2E3D4F5-6A7B-4C8D-9E0F-1A2B3C4D5E6F',N'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F','2026-08-17 20:53:50.737',NULL,NULL,NULL,0);
INSERT INTO [hvc-db].auth.sucursal (id,nombre,municipio,departamento,telefono,direccion,central,created_at) VALUES
	 (N'B1D2C3E4-5F6A-4B7C-8D9E-0A1B2C3D4E5F',N'GENERAL',N'Guatemala',N'Guatemala',NULL,NULL,1,'2026-08-17 20:53:50.71'),
	 (N'F6C3D363-54A2-4396-8BB3-86CB377236E9',N'Sucursal Central',N'GUATEMALA',N'GUATEMALA',N'2345-6789',N'5a Avenida 10-20, Zona 1',0,'2026-08-28 16:15:39.41');
