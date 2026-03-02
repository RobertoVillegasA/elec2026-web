-- Script para modificar columnas de imágenes en la tabla actas
-- Ejecutar este script para cambiar el tipo de dato de BLOB a TEXT

USE elec2026;

-- Verificar estructura actual
DESCRIBE actas;

-- Modificar columnas f_acta y f_h_trabajo a tipo TEXT para almacenar URLs/nombres de archivos
-- Esto permite almacenar múltiples nombres de archivos separados por coma

ALTER TABLE actas 
MODIFY COLUMN f_acta TEXT NULL COMMENT 'Nombres de archivos de acta separados por coma (ej: a_001,a_001_1,a_001_2)';

ALTER TABLE actas 
MODIFY COLUMN f_h_trabajo TEXT NULL COMMENT 'Nombres de archivos de hoja de trabajo separados por coma (ej: h_001,h_001_1,h_001_2)';

-- Verificar cambios
DESCRIBE actas;

-- Mostrar mensaje de éxito
SELECT '✅ Columnas modificadas exitosamente a tipo TEXT' AS resultado;
