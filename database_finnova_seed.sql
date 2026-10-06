-- =======================================================
-- SCRIPT DE INICIALIZACIÓN Y CARGA DE DATOS: FINNOVA
-- Base de datos: db_finnova
-- =======================================================

CREATE DATABASE IF NOT EXISTS db_finnova CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_finnova;

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia si aplica
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla ROLES
CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 2. Tabla USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(15) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    contrasena_hash VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);


-- 3. Tabla CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL,
    dni VARCHAR(15) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    id_asesor_preferente INT NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_cliente_asesor FOREIGN KEY (id_asesor_preferente) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- 4. Tabla PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    ruc VARCHAR(11) UNIQUE,
    nombre_empresa VARCHAR(150) NOT NULL,
    tipo_alianza VARCHAR(50) NOT NULL,
    porcentaje_comision DECIMAL(5,2) DEFAULT 0.00,
    contacto_nombre VARCHAR(100),
    contacto_email VARCHAR(100),
    contacto_telefono VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL,
    precio_tarifa DECIMAL(10,2) NOT NULL,
    url_imagen LONGTEXT,
    id_proveedor INT NULL,
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_servicio_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
);

-- 6. Tabla SOLICITUDES
CREATE TABLE IF NOT EXISTS solicitudes (
    id_solicitud VARCHAR(20) PRIMARY KEY,
    id_cliente INT NULL,
    id_servicio INT NULL,
    monto_servicio DECIMAL(10,2) NOT NULL,
    notas_consulta TEXT,
    estado_pago VARCHAR(20) DEFAULT 'Pendiente',
    numero_operacion_yape VARCHAR(50),
    monto_pagado DECIMAL(10,2),
    fecha_pago_validado DATETIME,
    id_asesor_asignado INT NULL,
    estado_atencion VARCHAR(30) DEFAULT 'Nueva',
    porcentaje_comision_aliado DECIMAL(5,2) DEFAULT 0.00,
    monto_comision_broker DECIMAL(10,2) DEFAULT 0.00,
    conclusion_cierre TEXT,
    observaciones_asesoria TEXT,
    resultado_asesoria TEXT,
    url_voucher_imagen LONGTEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    CONSTRAINT fk_solicitud_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_solicitud_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE SET NULL,
    CONSTRAINT fk_solicitud_asesor FOREIGN KEY (id_asesor_asignado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- 7. Tabla CITAS
CREATE TABLE IF NOT EXISTS citas (
    id_cita VARCHAR(20) PRIMARY KEY,
    id_solicitud VARCHAR(20) NULL,
    id_cliente INT NULL,
    id_asesor INT NULL,
    fecha_hora DATETIME NOT NULL,
    modalidad VARCHAR(20) NOT NULL,
    lugar_o_enlace VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'Programada',
    indicaciones_previas TEXT,
    observaciones_atencion TEXT,
    resultados_acuerdos TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
    CONSTRAINT fk_cita_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_cita_asesor FOREIGN KEY (id_asesor) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- 8. Tabla CAMPANIAS
CREATE TABLE IF NOT EXISTS campanias (
    id_campana INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    mensaje_promocional TEXT NOT NULL,
    publico_objetivo VARCHAR(50) DEFAULT 'General',
    categoria VARCHAR(50),
    url_imagen LONGTEXT,
    estado VARCHAR(20) DEFAULT 'Activa',
    id_servicio INT NULL,
    id_proveedor INT NULL,
    fecha_programada DATETIME,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario_creador INT NULL,
    CONSTRAINT fk_campania_servicio FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE SET NULL,
    CONSTRAINT fk_campania_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL,
    CONSTRAINT fk_campania_usuario FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- 9. Tabla LOGS_AUDITORIA_SEGURIDAD (Auditoría y Detección de Amenazas)
CREATE TABLE IF NOT EXISTS logs_auditoria_seguridad (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento VARCHAR(50) NOT NULL,
    id_usuario INT NULL,
    correo_intentado VARCHAR(100) NULL,
    ip_origen VARCHAR(45) NOT NULL,
    detalles TEXT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);


SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- INSERCIÓN DE DATOS SEMILLA (SEED DATA)
-- =======================================================

-- 1. Insertar ROLES
INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'Administrador', 'Control total de la plataforma, configuración, usuarios y reportes generales'),
(2, 'Asesor', 'Atención de solicitudes, gestión de citas financieras y seguimiento de clientes'),
(3, 'Cliente', 'Portal público y consulta de estado de asesorías contratadas')
ON DUPLICATE KEY UPDATE nombre_rol=VALUES(nombre_rol), descripcion=VALUES(descripcion);

-- 2. Insertar USUARIOS
-- Contraseñas:
-- Para admin@finnova.pe -> 'admin123' (hash bcrypt)
-- Para asesores y clientes -> 'password123' (hash bcrypt)
INSERT INTO usuarios (id_usuario, dni, nombre_completo, correo_electronico, telefono, contrasena_hash, id_rol, estado) VALUES
(1, '00000001', 'Administrador Principal Finnova', 'admin@finnova.pe', '999888777', '$2b$10$3j/UTztKHxDEBwif9CcWCuYWGX5glWVpoJ/xJ.HHqhydJeozSfIv6', 1, 'Activo'),
(2, '10293847', 'Juan Pérez Morales', 'juan.asesor@finnova.pe', '987112233', '$2b$10$GINvKiEQ38PKL4j9hrSAKeQm.80LhhrYewp7N20.KVDyJArt0ZNEu', 2, 'Activo'),
(3, '56473829', 'Ana Gómez Huamán', 'ana.asesora@finnova.pe', '976554433', '$2b$10$GINvKiEQ38PKL4j9hrSAKeQm.80LhhrYewp7N20.KVDyJArt0ZNEu', 2, 'Activo'),
(4, '72345678', 'María López Rojas', 'maria@ejemplo.com', '987654321', '$2b$10$GINvKiEQ38PKL4j9hrSAKeQm.80LhhrYewp7N20.KVDyJArt0ZNEu', 3, 'Activo'),
(5, '45678901', 'Carlos Pérez Silva', 'carlos@ejemplo.com', '912345678', '$2b$10$GINvKiEQ38PKL4j9hrSAKeQm.80LhhrYewp7N20.KVDyJArt0ZNEu', 3, 'Activo')
ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo), contrasena_hash=VALUES(contrasena_hash), id_rol=VALUES(id_rol);

-- 3. Insertar PROVEEDORES (Aliados Financieros y Aseguradoras)
INSERT INTO proveedores (id_proveedor, ruc, nombre_empresa, tipo_alianza, porcentaje_comision, contacto_nombre, contacto_email, contacto_telefono, estado) VALUES
(1, '20100041953', 'Rímac Seguros', 'Aseguradora', 12.50, 'Carla Méndez', 'convenios@rimac.com.pe', '944111222', 'Activo'),
(2, '20332970411', 'Pacífico Seguros', 'Aseguradora', 10.00, 'Roberto Silva', 'alianzas@pacifico.com.pe', '955222333', 'Activo'),
(3, '20167041111', 'AFP Integra', 'Fondo de Pensiones', 8.00, 'Lucía Valdivia', 'corporativo@integra.pe', '966333444', 'Activo'),
(4, '20257042222', 'Prima AFP', 'Fondo de Pensiones', 8.50, 'Fernando Díaz', 'contacto@prima.com.pe', '977444555', 'Activo'),
(5, '20100053455', 'Interbank', 'Banca y Créditos', 5.00, 'Manuel Rojas', 'hipotecas@interbank.pe', '988555666', 'Activo'),
(6, '20100130204', 'BBVA Perú', 'Banca y Créditos', 5.50, 'Patricia Vega', 'convenios@bbva.pe', '999666777', 'Activo')
ON DUPLICATE KEY UPDATE nombre_empresa=VALUES(nombre_empresa), porcentaje_comision=VALUES(porcentaje_comision);

-- 4. Insertar SERVICIOS (Catálogo disponible en Landing y Gestión)
INSERT INTO servicios (id_servicio, titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado) VALUES
(1, 'Asesoría en Retiro y Fondos AFP', 'Orientación experta para el retiro de fondos AFP, Bono de Reconocimiento y evaluación de modalidades de pensión.', 'Pensional', 150.00, 'assets/images/afp.jpg', 3, 'Activo'),
(2, 'Planificación de Jubilación ONP y Trámites', 'Asesoramiento técnico legal para el reconocimiento de aportes en la ONP y cálculo de pensión vitalicia.', 'Pensional', 120.00, 'assets/images/onp.jpg', NULL, 'Activo'),
(3, 'Seguro de Vida y Salud Integral', 'Cotización, comparativa y estructuración de pólizas familiares de vida con retorno e indemnizaciones médicas.', 'Aseguradoras', 180.00, 'assets/images/seguro_vida.jpg', 1, 'Activo'),
(4, 'Asesoría en Créditos Hipotecarios y Deudas', 'Optimización de tasas de interés, evaluación de capacidad crediticia y consolidación de deudas financieras.', 'Financiero', 250.00, 'assets/images/hipoteca.jpg', 5, 'Activo'),
(5, 'Inversiones y Fondos Mutuos', 'Diseño de portafolio personalizado según tu perfil de riesgo con rentabilidad en instrumentos de renta fija.', 'Inversión', 200.00, 'assets/images/inversiones.jpg', 6, 'Activo'),
(6, 'Seguro Vehicular y Protección Patrimonial', 'Asesoría en coberturas todo riesgo, cláusulas de deducibles y pólizas de protección para flotas o vehículos personales.', 'Aseguradoras', 95.00, 'assets/images/seguro_vehicular.jpg', 2, 'Activo')
ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), descripcion=VALUES(descripcion), precio_tarifa=VALUES(precio_tarifa), id_proveedor=VALUES(id_proveedor), url_imagen=VALUES(url_imagen);

-- 5. Insertar CLIENTES
INSERT INTO clientes (id_cliente, id_usuario, dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado) VALUES
(1, 4, '72345678', 'María López Rojas', 'maria@ejemplo.com', '987654321', 'Av. Javier Prado Este 1234, San Isidro, Lima', 2, 'Activo'),
(2, 5, '45678901', 'Carlos Pérez Silva', 'carlos@ejemplo.com', '912345678', 'Jr. Las Camelias 450, San Borja, Lima', 2, 'Activo'),
(3, NULL, '09876543', 'Rosa Morales Chávez', 'rosa.morales@gmail.com', '945678123', 'Av. Arequipa 2210, Lince, Lima', 3, 'Activo'),
(4, NULL, '71239845', 'Jorge Ramírez Torres', 'jorge.ramirez@hotmail.com', '933221144', 'Calle Los Pinos 180, Miraflores, Lima', NULL, 'Activo')
ON DUPLICATE KEY UPDATE nombre_completo=VALUES(nombre_completo), correo_electronico=VALUES(correo_electronico), id_asesor_preferente=VALUES(id_asesor_preferente);

-- 6. Insertar SOLICITUDES
INSERT INTO solicitudes (id_solicitud, id_cliente, id_servicio, monto_servicio, notas_consulta, estado_pago, numero_operacion_yape, monto_pagado, fecha_pago_validado, id_asesor_asignado, estado_atencion, porcentaje_comision_aliado, monto_comision_broker, conclusion_cierre, fecha_registro) VALUES
('SOL-001', 1, 1, 150.00, 'Consulta sobre requisitos para el retiro voluntario del 95.5% de mi fondo AFP.', 'Pagado', 'OP-9823412', 150.00, '2026-09-18 10:30:00', 2, 'En Proceso', 8.00, 12.00, NULL, '2026-09-18 09:15:00'),
('SOL-002', 2, 3, 180.00, 'Deseo cotizar seguro de vida con retorno de primas para mi familia.', 'Pagado', 'OP-1102934', 180.00, '2026-09-19 14:00:00', 2, 'Atendida', 12.50, 22.50, 'Cliente seleccionó póliza Vida Integral Rímac. Se programó firma de póliza.', '2026-09-19 11:20:00'),
('SOL-003', 3, 4, 250.00, 'Evaluación para compra de departamento mediante crédito hipotecario.', 'Pendiente', 'OP-5564738', 250.00, NULL, 3, 'Nueva', 5.00, 12.50, NULL, '2026-09-21 16:45:00'),
('SOL-004', 4, 6, 95.00, 'Cotización seguro vehicular para camioneta SUV 2024.', 'Pendiente', NULL, NULL, NULL, NULL, 'Nueva', 10.00, 9.50, NULL, '2026-09-22 08:30:00')
ON DUPLICATE KEY UPDATE monto_servicio=VALUES(monto_servicio), estado_pago=VALUES(estado_pago), estado_atencion=VALUES(estado_atencion);

-- 7. Insertar CITAS
INSERT INTO citas (id_cita, id_solicitud, id_cliente, id_asesor, fecha_hora, modalidad, lugar_o_enlace, estado, indicaciones_previas, observaciones_atencion, resultados_acuerdos) VALUES
('CIT-001', 'SOL-001', 1, 2, '2026-09-26 10:00:00', 'Virtual', 'https://meet.google.com/abc-defg-hij', 'Programada', 'Tener a la mano último estado de cuenta de AFP Integra.', 'Reunión inicial de análisis pensional.', NULL),
('CIT-002', 'SOL-002', 2, 2, '2026-09-20 15:30:00', 'Presencial', 'Oficina Central Finnova - Sala 3', 'Realizada', 'DNI original de titulares y beneficiarios.', 'Se explicaron los beneficios de cobertura por invalidez y retorno al 100%.', 'Aceptó propuesta N° 4492.'),
('CIT-003', 'SOL-003', 3, 3, '2026-09-27 16:00:00', 'Virtual', 'https://meet.google.com/xyz-uvwx-rst', 'Programada', 'Últimas 3 boletas de pago o recibos por honorarios.', 'Revisión de récord crediticio en Sentinel/SBS.', NULL)
ON DUPLICATE KEY UPDATE fecha_hora=VALUES(fecha_hora), estado=VALUES(estado);

-- 8. Insertar CAMPANIAS PROMOCIONALES
INSERT INTO campanias (id_campana, titulo, mensaje_promocional, publico_objetivo, categoria, url_imagen, estado, fecha_programada, id_usuario_creador) VALUES
(1, 'Campaña Especial Retiro AFP 2026', 'Aprovecha nuestra asesoría especializada con 20% de descuento para gestionar tu solicitud de fondos con máxima rentabilidad.', 'General', 'Pensional', 'assets/images/campaign_afp.jpg', 'Activa', '2026-10-01 09:00:00', 1),
(2, 'Protege a tu Familia - Seguro de Vida', 'Pólizas con devolución del 100% de aportes y cobertura médica internacional. Consulta con tu asesor asignado.', 'Clientes', 'Aseguradoras', 'assets/images/campaign_seguro.jpg', 'Activa', '2026-10-05 10:00:00', 1),
(3, 'Tasa Preferencial Crédito Hipotecario', 'Convenios exclusivos con Interbank y BBVA con hasta 0.5% menos en TEA.', 'General', 'Financiero', 'assets/images/campaign_credito.jpg', 'Borrador', '2026-10-15 09:00:00', 1)
ON DUPLICATE KEY UPDATE titulo=VALUES(titulo), mensaje_promocional=VALUES(mensaje_promocional), estado=VALUES(estado);
