-- ============================================================
--  Gest Docs App — Schema completo para Supabase
--  Estrategia de acceso:
--    · Gestoría  → Supabase Auth (auth.uid() = gestoria.id)
--    · Cliente   → token_acceso UUID, sin sesión Supabase
--                  El servidor llama a set_client_token(token)
--                  antes de ejecutar queries del cliente.
-- ============================================================

-- ── Extensiones ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tipos ENUM ──────────────────────────────────────────────
CREATE TYPE plan_type            AS ENUM ('basico', 'profesional', 'enterprise');
CREATE TYPE estado_expediente    AS ENUM ('pendiente', 'completo');
CREATE TYPE tipo_documento_enum  AS ENUM ('factura', 'dni', 'modelo_fiscal', 'otro');
CREATE TYPE estado_req           AS ENUM ('pendiente', 'recibido');

-- ============================================================
--  TABLAS
-- ============================================================

-- gestoria ───────────────────────────────────────────────────
-- id = auth.users.id  (1-a-1 con la cuenta de Supabase Auth)
CREATE TABLE gestoria (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT        NOT NULL,
  email      TEXT        NOT NULL UNIQUE,
  plan       plan_type   NOT NULL DEFAULT 'basico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cliente ────────────────────────────────────────────────────
CREATE TABLE cliente (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  gestoria_id    UUID        NOT NULL REFERENCES gestoria(id) ON DELETE CASCADE,
  nombre         TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  telefono       TEXT,
  token_acceso   UUID        NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cliente_gestoria  ON cliente(gestoria_id);
CREATE INDEX idx_cliente_token     ON cliente(token_acceso);

-- expediente ─────────────────────────────────────────────────
CREATE TABLE expediente (
  id         UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID                 NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
  nombre     TEXT                 NOT NULL,
  periodo    TEXT                 NOT NULL,          -- ej: "Q1 2025", "Enero 2025"
  estado     estado_expediente    NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expediente_cliente ON expediente(cliente_id);

-- documento ──────────────────────────────────────────────────
CREATE TABLE documento (
  id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id   UUID                NOT NULL REFERENCES expediente(id) ON DELETE CASCADE,
  nombre_archivo  TEXT                NOT NULL,
  tipo            tipo_documento_enum NOT NULL DEFAULT 'otro',
  url_storage     TEXT                NOT NULL,
  subido_at       TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_documento_expediente ON documento(expediente_id);

-- requerimiento ──────────────────────────────────────────────
CREATE TABLE requerimiento (
  id              UUID                NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  expediente_id   UUID                NOT NULL REFERENCES expediente(id) ON DELETE CASCADE,
  tipo_documento  tipo_documento_enum NOT NULL,
  obligatorio     BOOLEAN             NOT NULL DEFAULT TRUE,
  estado          estado_req          NOT NULL DEFAULT 'pendiente'
);
CREATE INDEX idx_requerimiento_expediente ON requerimiento(expediente_id);

-- ============================================================
--  HELPER: token de cliente por sesión
--  El servidor Next.js llama a esta función antes de queries
--  del portal de cliente:
--    await supabase.rpc('set_client_token', { token: '...' })
-- ============================================================
CREATE OR REPLACE FUNCTION set_client_token(token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- true = local a la transacción actual
  PERFORM set_config('app.client_token', token::TEXT, true);
END;
$$;

-- Helper interno: devuelve el cliente_id activo en la sesión
CREATE OR REPLACE FUNCTION current_cliente_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id
  FROM   cliente
  WHERE  token_acceso = current_setting('app.client_token', true)::UUID
  LIMIT  1;
$$;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE gestoria      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente       ENABLE ROW LEVEL SECURITY;
ALTER TABLE expediente    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento     ENABLE ROW LEVEL SECURITY;
ALTER TABLE requerimiento ENABLE ROW LEVEL SECURITY;

-- ── gestoria ─────────────────────────────────────────────────
-- Cada gestoría solo ve y edita su propia fila
CREATE POLICY "gestoria: ver propia"
  ON gestoria FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "gestoria: editar propia"
  ON gestoria FOR UPDATE
  USING (id = auth.uid());

-- ── cliente ──────────────────────────────────────────────────
-- Gestoría: CRUD sobre sus propios clientes
CREATE POLICY "cliente: gestoría CRUD"
  ON cliente FOR ALL
  USING (gestoria_id = auth.uid());

-- Cliente portal: puede leer su propio registro
CREATE POLICY "cliente: leer propio (token)"
  ON cliente FOR SELECT
  USING (id = current_cliente_id());

-- ── expediente ───────────────────────────────────────────────
-- Gestoría: ve/modifica expedientes de sus clientes
CREATE POLICY "expediente: gestoría CRUD"
  ON expediente FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM cliente c
      WHERE c.id = expediente.cliente_id
        AND c.gestoria_id = auth.uid()
    )
  );

-- Cliente portal: ve sus propios expedientes
CREATE POLICY "expediente: cliente lectura (token)"
  ON expediente FOR SELECT
  USING (cliente_id = current_cliente_id());

-- ── documento ────────────────────────────────────────────────
-- Gestoría: CRUD en documentos de sus expedientes
CREATE POLICY "documento: gestoría CRUD"
  ON documento FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM expediente e
      JOIN cliente    c ON c.id = e.cliente_id
      WHERE e.id = documento.expediente_id
        AND c.gestoria_id = auth.uid()
    )
  );

-- Cliente portal: puede ver Y subir documentos a sus expedientes
CREATE POLICY "documento: cliente lectura (token)"
  ON documento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expediente e
      WHERE e.id = documento.expediente_id
        AND e.cliente_id = current_cliente_id()
    )
  );

CREATE POLICY "documento: cliente insertar (token)"
  ON documento FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expediente e
      WHERE e.id = documento.expediente_id
        AND e.cliente_id = current_cliente_id()
    )
  );

-- ── requerimiento ────────────────────────────────────────────
-- Gestoría: CRUD
CREATE POLICY "requerimiento: gestoría CRUD"
  ON requerimiento FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM expediente e
      JOIN cliente    c ON c.id = e.cliente_id
      WHERE e.id = requerimiento.expediente_id
        AND c.gestoria_id = auth.uid()
    )
  );

-- Cliente portal: lectura + puede cambiar estado a 'recibido'
CREATE POLICY "requerimiento: cliente lectura (token)"
  ON requerimiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expediente e
      WHERE e.id = requerimiento.expediente_id
        AND e.cliente_id = current_cliente_id()
    )
  );

CREATE POLICY "requerimiento: cliente actualizar estado (token)"
  ON requerimiento FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expediente e
      WHERE e.id = requerimiento.expediente_id
        AND e.cliente_id = current_cliente_id()
    )
  )
  WITH CHECK (estado = 'recibido');   -- cliente solo puede marcar como recibido

-- ============================================================
--  TRIGGER: auto-crear expediente.estado = completo
--  cuando todos los requerimientos obligatorios estén recibidos
-- ============================================================
CREATE OR REPLACE FUNCTION check_expediente_completo()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM requerimiento
    WHERE expediente_id = NEW.expediente_id
      AND obligatorio   = TRUE
      AND estado        = 'pendiente'
  ) THEN
    UPDATE expediente
    SET estado = 'completo'
    WHERE id   = NEW.expediente_id
      AND estado = 'pendiente';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_expediente_completo
  AFTER UPDATE OF estado ON requerimiento
  FOR EACH ROW
  WHEN (NEW.estado = 'recibido')
  EXECUTE FUNCTION check_expediente_completo();
