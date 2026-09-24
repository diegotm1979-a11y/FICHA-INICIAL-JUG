-- ==============================================================================
-- SCRIPT SQL COMPLETO PARA SUPABASE
-- Proyecto: Fichas Iniciales de Temporada - Cuerpo Técnico y Plantilla
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Entra en tu proyecto -> SQL Editor (icono de terminal a la izquierda) -> New Query
-- 3. Pega este código completo y pulsa "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA PRINCIPAL: FICHAS DE JUGADORES (public.players)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  staff_notes TEXT DEFAULT ''
);

-- Índices de optimización y búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_players_submitted_at ON public.players (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_full_name ON public.players (full_name);
CREATE INDEX IF NOT EXISTS idx_players_data_gin ON public.players USING GIN (data);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clientes (anon y authenticated)
DROP POLICY IF EXISTS "Permitir lectura publica players" ON public.players;
CREATE POLICY "Permitir lectura publica players" ON public.players
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica players" ON public.players;
CREATE POLICY "Permitir insercion publica players" ON public.players
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica players" ON public.players;
CREATE POLICY "Permitir actualizacion publica players" ON public.players
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica players" ON public.players;
CREATE POLICY "Permitir eliminacion publica players" ON public.players
  FOR DELETE TO anon, authenticated USING (true);


-- ------------------------------------------------------------------------------
-- 2. TABLA DE CONFIGURACIÓN DEL CLUB Y ESCUDO (public.club_profile)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  club_name TEXT NOT NULL DEFAULT '',
  subheading TEXT NOT NULL DEFAULT 'Ficha Inicial de Temporada',
  crest_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.club_profile ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DROP POLICY IF EXISTS "Permitir todo club_profile" ON public.club_profile;
CREATE POLICY "Permitir todo club_profile" ON public.club_profile
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Insertar perfil por defecto si no existe
INSERT INTO public.club_profile (id, club_name, subheading, crest_url)
VALUES ('default', 'C.D. FÚTBOL', 'Ficha Inicial de Temporada', NULL)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 3. TABLA DE USUARIOS Y GESTIÓN DE PERMISOS (public.app_users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'coach',
  role_title TEXT DEFAULT 'Cuerpo Técnico',
  password TEXT NOT NULL DEFAULT '1234',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por nombre de usuario al iniciar sesión
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users (username);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DROP POLICY IF EXISTS "Permitir todo app_users" ON public.app_users;
CREATE POLICY "Permitir todo app_users" ON public.app_users
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 4. USUARIOS INICIALES POR DEFECTO
-- ------------------------------------------------------------------------------
INSERT INTO public.app_users (id, username, full_name, email, role, role_title, password, permissions, is_active)
VALUES
  (
    'user-admin',
    'admin',
    'Director Técnico (Admin)',
    'admin@club.com',
    'admin',
    'Director Técnico / Administrador',
    'admin',
    '["can_fill_form", "can_view_dashboard", "can_view_player_details", "can_edit_staff_notes", "can_export_reports", "can_delete_players", "can_manage_club", "can_manage_users"]'::jsonb,
    true
  ),
  (
    'user-coach',
    'entrenador',
    'Segundo Entrenador',
    'staff@club.com',
    'coach',
    'Cuerpo Técnico',
    'staff',
    '["can_fill_form", "can_view_dashboard", "can_view_player_details", "can_edit_staff_notes", "can_export_reports"]'::jsonb,
    true
  ),
  (
    'user-staff',
    'fisico',
    'Preparador Físico',
    'preparacion@club.com',
    'staff',
    'Preparador Físico / Readaptador',
    'staff',
    '["can_view_dashboard", "can_view_player_details", "can_edit_staff_notes", "can_export_reports"]'::jsonb,
    true
  ),
  (
    'user-player',
    'jugador',
    'Jugador Plantilla',
    'jugador@club.com',
    'player',
    'Jugador de la Plantilla',
    'jugador',
    '["can_fill_form"]'::jsonb,
    true
  )
ON CONFLICT (username) DO NOTHING;
