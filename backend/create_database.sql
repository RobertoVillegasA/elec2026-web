-- Estructura completa de la base de datos electoral
-- Ejecutar en Railway MySQL

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- TABLAS CATÁLOGO
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departamentos (
  id_departamento INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS provincias (
  id_provincia INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  id_departamento INT NOT NULL,
  UNIQUE KEY unique_prov_depto (nombre, id_departamento),
  FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS municipios (
  id_municipio INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  id_provincia INT NOT NULL,
  UNIQUE KEY unique_muni_prov (nombre, id_provincia),
  FOREIGN KEY (id_provincia) REFERENCES provincias(id_provincia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recintos (
  id_recinto INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  id_municipio INT NOT NULL,
  id_distrito VARCHAR(50) DEFAULT NULL,
  UNIQUE KEY unique_recinto_muni (nombre, id_municipio),
  FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mesas (
  id_mesa INT AUTO_INCREMENT PRIMARY KEY,
  numero_mesa INT NOT NULL,
  id_recinto INT NOT NULL,
  UNIQUE KEY unique_mesa_recinto (numero_mesa, id_recinto),
  FOREIGN KEY (id_recinto) REFERENCES recintos(id_recinto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organizaciones_politicas (
  id_organizacion INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  sigla VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cargos (
  id_cargo INT AUTO_INCREMENT PRIMARY KEY,
  nombre_cargo VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- USUARIOS Y SEGURIDAD
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  fullname VARCHAR(200),
  id_rol INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CANDIDATOS
-- ============================================

CREATE TABLE IF NOT EXISTS candidatos (
  id_candidato INT AUTO_INCREMENT PRIMARY KEY,
  id_organizacion INT NOT NULL,
  id_cargo INT NOT NULL,
  id_departamento INT DEFAULT NULL,
  id_municipio INT DEFAULT NULL,
  nombres VARCHAR(200) NOT NULL,
  apellidos VARCHAR(200) NOT NULL,
  genero ENUM('M', 'F') DEFAULT NULL,
  edad INT DEFAULT NULL,
  tipo_candidatura ENUM('TITULAR', 'SUPLENTE') DEFAULT 'TITULAR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_organizacion) REFERENCES organizaciones_politicas(id_organizacion),
  FOREIGN KEY (id_cargo) REFERENCES cargos(id_cargo),
  FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento),
  FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ACTAS Y VOTOS
-- ============================================

CREATE TABLE IF NOT EXISTS actas (
  id_acta INT AUTO_INCREMENT PRIMARY KEY,
  id_mesa INT NOT NULL,
  tipo_papeleta ENUM('PRESIDENCIAL', 'SUBNACIONAL', 'AUTONOMÍAS', 'REFERENDO') NOT NULL,
  codigo_acta VARCHAR(50) DEFAULT NULL,
  votos_blancos_gob INT DEFAULT 0,
  votos_nulos_gob INT DEFAULT 0,
  votos_blancos_alc INT DEFAULT 0,
  votos_nulos_alc INT DEFAULT 0,
  votos_blancos_con INT DEFAULT 0,
  votos_nulos_con INT DEFAULT 0,
  votos_blancos_amu INT DEFAULT 0,
  votos_nulos_amu INT DEFAULT 0,
  votos_blancos_tot INT DEFAULT 0,
  votos_nulos_tot INT DEFAULT 0,
  observaciones TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS votos_detalle (
  id_voto_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_acta INT NOT NULL,
  id_organizacion INT NOT NULL,
  votos_cantidad INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_acta) REFERENCES actas(id_acta) ON DELETE CASCADE,
  FOREIGN KEY (id_organizacion) REFERENCES organizaciones_politicas(id_organizacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DELEGADOS (unificado con coordinadores)
-- ============================================

CREATE TABLE IF NOT EXISTS delegados (
  id_delegado INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  ci VARCHAR(20) NOT NULL,
  telefono VARCHAR(20) DEFAULT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  id_organizacion INT DEFAULT NULL,
  id_mesa INT DEFAULT NULL,
  id_recinto INT DEFAULT NULL,
  id_rol INT DEFAULT 6,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ci (ci),
  FOREIGN KEY (id_organizacion) REFERENCES organizaciones_politicas(id_organizacion),
  FOREIGN KEY (id_mesa) REFERENCES mesas(id_mesa),
  FOREIGN KEY (id_recinto) REFERENCES recintos(id_recinto),
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================

CREATE INDEX idx_actas_mesa ON actas(id_mesa);
CREATE INDEX idx_actas_tipo ON actas(tipo_papeleta);
CREATE INDEX idx_votos_detalle_acta ON votos_detalle(id_acta);
CREATE INDEX idx_votos_detalle_org ON votos_detalle(id_organizacion);
CREATE INDEX idx_delegados_mesa ON delegados(id_mesa);
CREATE INDEX idx_delegados_recinto ON delegados(id_recinto);
CREATE INDEX idx_delegados_rol ON delegados(id_rol);
CREATE INDEX idx_candidatos_org ON candidatos(id_organizacion);
CREATE INDEX idx_candidatos_cargo ON candidatos(id_cargo);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- DATOS INICIALES (SEED)
-- ============================================

-- Roles
INSERT INTO roles (nombre_rol) VALUES 
('ADMIN'),
('COORDINADOR'),
('RECEPTADOR'),
('USUARIO'),
('COORDINADOR_RECINTO'),
('DELEGADO')
ON DUPLICATE KEY UPDATE nombre_rol=VALUES(nombre_rol);

-- Cargos
INSERT INTO cargos (nombre_cargo) VALUES 
('PRESIDENTE'),
('VICEPRESIDENTE'),
('GOBERNADOR'),
('VICEGOBERNADOR'),
('ALCALDE'),
('VICEALCALDE'),
('CONCEJAL'),
('CONSEJERO DEPARTAMENTAL'),
('AGENTE MUNICIPAL'),
('MAJORCA')
ON DUPLICATE KEY UPDATE nombre_cargo=VALUES(nombre_cargo);

-- Organizaciones políticas (ejemplo - ajustar según necesites)
INSERT INTO organizaciones_politicas (nombre, sigla) VALUES 
('MOVIMIENTO AL SOCIALISMO', 'MAS'),
('MOVIMIENTO DEMOCRÁTICO SOCIAL', 'MDS'),
('CREEMOS', 'CREEMOS'),
('COMUNIDAD CIUDADANA', 'CC'),
('LIBRE 21', 'LIBRE'),
('LIBRE GOBERNADOR', 'LIBRE_GOB'),
('LIBRE ALCALDE', 'LIBRE_ALC')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), sigla=VALUES(sigla);

-- Departamentos de Bolivia
INSERT INTO departamentos (nombre) VALUES 
('Beni'),
('Chuquisaca'),
('Cochabamba'),
('La Paz'),
('Oruro'),
('Pando'),
('Potosí'),
('Santa Cruz'),
('Tarija')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Usuario admin por defecto (password: admin123)
-- IMPORTANTE: Cambiar la contraseña en producción
INSERT INTO usuarios (username, password_hash, fullname, id_rol) VALUES 
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzS3MebAJu', 'Administrador', 1)
ON DUPLICATE KEY UPDATE username=VALUES(username);
