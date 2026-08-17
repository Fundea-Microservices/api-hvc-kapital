-- ==========================================
-- 0. BORRADO SEGURO DE TABLAS
-- ==========================================
-- Se deshabilitan las llaves foráneas temporalmente para poder borrar sin errores de dependencia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS movimiento_insumo;
DROP TABLE IF EXISTS insumos;
DROP TABLE IF EXISTS categoria_insumo;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. TABLA: Categorías de Insumos
-- ==========================================
CREATE TABLE categoria_insumo (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por nombre de categoría
CREATE INDEX idx_categoria_nombre ON categoria_insumo(nombre);

-- ==========================================
-- 2. TABLA: Insumos
-- ==========================================
CREATE TABLE insumos (
    id CHAR(36) PRIMARY KEY,
    categoria_id CHAR(36),
    codigo VARCHAR(50) UNIQUE NOT NULL, -- UNIQUE ya crea un índice internamente
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    unidad VARCHAR(50) NOT NULL, 
    cantidad_actual DECIMAL(12,2) DEFAULT 0.00,
    punto_minimo DECIMAL(12,2) NOT NULL,
    punto_medio DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) DEFAULT 0.00,
    estado TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categoria_insumo(id) ON DELETE SET NULL
);

-- Índices para mejorar reportes y búsquedas en el catálogo
CREATE INDEX idx_insumos_nombre ON insumos(nombre);
CREATE INDEX idx_insumos_estado ON insumos(estado);

-- ==========================================
-- 3. TABLA: Movimientos de Insumos
-- ==========================================
CREATE TABLE movimiento_insumo (
    id CHAR(36) PRIMARY KEY,
    insumo_id CHAR(36) NOT NULL,
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    costo_unitario DECIMAL(12,2) DEFAULT 0.00, -- NUEVO: Para guardar el costo al momento del movimiento
    motivo VARCHAR(255),
    usuario_id CHAR(36), 
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

-- Índices para optimizar reportes de movimientos por fecha y tipo
CREATE INDEX idx_movimiento_fecha ON movimiento_insumo(fecha_movimiento);
CREATE INDEX idx_movimiento_tipo ON movimiento_insumo(tipo_movimiento);
CREATE INDEX idx_movimiento_insumo ON movimiento_insumo(insumo_id);