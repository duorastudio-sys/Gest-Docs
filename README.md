# Gest Docs

Plataforma de gestión documental para gestorías. Permite a las gestorías crear portales personalizados para que sus clientes suban documentación, con clasificación automática y recordatorios por email.

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Base de datos / Auth / Storage**: Supabase
- **Email**: Resend
- **Estilos**: Tailwind CSS
- **Deploy**: Vercel

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase — https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>

# Resend — https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

> `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY` son secretos de servidor. Nunca los expongas en el cliente ni los comitees al repositorio.

Para producción en Vercel, añade estas variables en **Settings → Environment Variables**.

---

## Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción (tras build)
npm start

# Linter
npm run lint
```

---

## Setup de Supabase

### 1. Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Copia la URL y las claves (anon key y service role key) en `.env.local`.

### 2. Ejecutar el schema

En el **SQL Editor** de Supabase, ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql). Esto crea todas las tablas, enums, políticas RLS y triggers.

### 3. Ejecutar las migraciones

Después del schema inicial, ejecuta en orden los archivos de [`supabase/migrations/`](supabase/migrations/):

```
supabase/migrations/add_ultimo_recordatorio.sql
supabase/migrations/add_waitlist.sql
```

### 4. Crear el bucket de Storage

1. Ve a **Storage** en el dashboard de Supabase.
2. Crea un nuevo bucket llamado exactamente `documentos`.
3. Configura la política de acceso: el bucket puede ser privado (los uploads se hacen con la clave de servicio).

### 5. Configurar Resend

1. Crea una cuenta en [resend.com](https://resend.com).
2. Verifica tu dominio (o usa `onboarding@resend.dev` para pruebas).
3. En [`lib/emails.ts`](lib/emails.ts), actualiza el campo `from` con tu dominio verificado:
   ```
   from: 'Gest Docs <noreply@tudominio.com>'
   ```

---

## Crear la primera gestoría

Las gestorías se registran manualmente. Hay dos opciones:

### Opción A — Desde el dashboard de Supabase

1. Ve a **Authentication → Users → Add user**.
2. Introduce email y contraseña. Copia el `UUID` del usuario creado.
3. En el **SQL Editor**, inserta la fila en la tabla `gestoria`:
   ```sql
   INSERT INTO gestoria (id, nombre, email)
   VALUES (
     '<uuid-del-usuario>',
     'Mi Gestoría S.L.',
     'admin@migestoria.com'
   );
   ```

### Opción B — Desde el SQL Editor directamente

```sql
-- 1. Crear el usuario en Auth (solo funciona con service role)
SELECT auth.create_user(
  '{"email": "admin@migestoria.com", "password": "contraseña-segura", "email_confirm": true}'::jsonb
);

-- 2. Insertar en gestoria usando el UUID devuelto
INSERT INTO gestoria (id, nombre, email)
VALUES ('<uuid-devuelto>', 'Mi Gestoría S.L.', 'admin@migestoria.com');
```

Una vez creada, la gestoría puede iniciar sesión en `/login`.

---

## Estructura del proyecto

```
app/
├── page.tsx                          # Landing page (solicitud de acceso)
├── login/                            # Autenticación de gestoría
├── dashboard/                        # Área privada de gestoría
│   ├── page.tsx                      # Lista de clientes
│   ├── cliente/nuevo/                # Formulario nuevo cliente
│   └── cliente/[id]/                 # Detalle: expedientes, docs, requerimientos
├── portal/[token]/                   # Portal público del cliente (sin login)
└── api/
    ├── clientes/                     # POST — crear cliente
    ├── expedientes/                  # POST — crear expediente
    ├── recordatorio/[expediente_id]/ # POST — enviar recordatorio por email
    ├── portal/upload/                # POST — subir documento desde el portal
    └── waitlist/                     # POST — solicitar acceso (landing)

lib/
├── clasificador.ts                   # Clasifica documentos por nombre de archivo
├── emails.ts                         # Plantilla y envío de email con Resend
└── supabase/admin.ts                 # Cliente Supabase con service role key

utils/supabase/
├── client.ts                         # Cliente Supabase para el navegador
├── server.ts                         # Cliente Supabase para Server Components
└── middleware.ts                     # Cliente Supabase para middleware

supabase/
├── schema.sql                        # Schema completo de la base de datos
└── migrations/                       # Migraciones incrementales
```

---

## Flujo de uso

1. La gestoría crea un **cliente** desde el dashboard → se genera un `token_acceso` único.
2. La gestoría crea un **expediente** para ese cliente y define los **requerimientos** (qué documentos necesita).
3. La gestoría comparte el enlace `/portal/<token>` con el cliente.
4. El cliente entra al portal (sin login), ve los documentos pendientes y los sube.
5. El sistema clasifica automáticamente cada documento y marca el requerimiento como recibido.
6. Cuando todos los requerimientos obligatorios están recibidos, el expediente se marca como **completo** (trigger de base de datos).
7. La gestoría puede enviar **recordatorios** por email desde el dashboard si quedan documentos pendientes.
