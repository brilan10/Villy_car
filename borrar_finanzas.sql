-- Eliminar todos los ingresos y egresos (finanzas) de todas las empresas
DELETE FROM finanzas;

-- Si también deseas resetear el contador de IDs a 0 (opcional, recomendado para SQLite/MySQL si está vacío):
-- Para SQLite:
-- DELETE FROM sqlite_sequence WHERE name='finanzas';

-- Para MySQL:
-- ALTER TABLE finanzas AUTO_INCREMENT = 1;
