import { AppUser, AppPermission, ROLE_PRESETS } from '../types';
import { supabase, IS_SUPABASE_CONNECTED } from './supabase';

const USERS_STORAGE_KEY = 'ficha_inicial_app_users_v1';
const CURRENT_USER_SESSION_KEY = 'ficha_inicial_current_user_session_v1';

export const INITIAL_DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Director Técnico (Admin)',
    email: 'admin@club.com',
    role: 'admin',
    roleTitle: 'Director Técnico / Administrador',
    password: 'admin',
    permissions: [
      'can_fill_form',
      'can_view_dashboard',
      'can_view_player_details',
      'can_edit_staff_notes',
      'can_export_reports',
      'can_delete_players',
      'can_manage_club',
      'can_manage_users',
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: 'user-coach',
    username: 'entrenador',
    fullName: 'Segundo Entrenador',
    email: 'staff@club.com',
    role: 'coach',
    roleTitle: 'Cuerpo Técnico',
    password: 'staff',
    permissions: [
      'can_fill_form',
      'can_view_dashboard',
      'can_view_player_details',
      'can_edit_staff_notes',
      'can_export_reports',
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: 'user-staff',
    username: 'fisico',
    fullName: 'Preparador Físico',
    email: 'preparacion@club.com',
    role: 'staff',
    roleTitle: 'Preparador Físico / Readaptador',
    password: 'staff',
    permissions: [
      'can_view_dashboard',
      'can_view_player_details',
      'can_edit_staff_notes',
      'can_export_reports',
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    isActive: true,
  },
  {
    id: 'user-player',
    username: 'jugador',
    fullName: 'Jugador de Plantilla',
    email: 'plantilla@club.com',
    role: 'player',
    roleTitle: 'Jugador',
    password: 'jugador',
    permissions: ['can_fill_form'],
    createdAt: '2025-01-01T00:00:00.000Z',
    isActive: true,
  },
];

export function getStoredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_USERS));
      return INITIAL_DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_USERS));
    return INITIAL_DEFAULT_USERS;
  } catch {
    return INITIAL_DEFAULT_USERS;
  }
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    saveUsersToSupabase(users).catch((err) => {
      console.warn('Background Supabase users sync error:', err);
    });
  } catch (err) {
    console.error('Error saving users locally:', err);
  }
}

export function getCurrentUser(): AppUser | null {
  try {
    const local = localStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (local) {
      return JSON.parse(local);
    }
    const session = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  } catch {
    return null;
  }
}

export function setCurrentUserSession(user: AppUser | null, persistent: boolean = true): void {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_SESSION_KEY);
      sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
      return;
    }
    const serialized = JSON.stringify(user);
    if (persistent) {
      localStorage.setItem(CURRENT_USER_SESSION_KEY, serialized);
    }
    sessionStorage.setItem(CURRENT_USER_SESSION_KEY, serialized);
  } catch (err) {
    console.warn('Error saving current user session:', err);
  }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
    localStorage.removeItem('ficha_inicial_staff_auth_v1');
    localStorage.removeItem('ficha_inicial_staff_auth');
    sessionStorage.removeItem('ficha_inicial_staff_auth_v1');
    sessionStorage.removeItem('ficha_inicial_staff_auth');
  } catch {}
}

export function authenticateUser(
  usernameOrEmail: string,
  pass: string
): { success: boolean; user?: AppUser; error?: string } {
  const users = getStoredUsers();
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const cleanPass = pass.trim();

  const found = users.find(
    (u) =>
      u.username.toLowerCase() === cleanInput ||
      (u.email && u.email.toLowerCase() === cleanInput)
  );

  if (!found) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  if (!found.isActive) {
    return { success: false, error: 'Este usuario ha sido desactivado por el administrador' };
  }

  if (found.password !== cleanPass) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  // Update lastLoginAt
  const updatedUser: AppUser = {
    ...found,
    lastLoginAt: new Date().toISOString(),
  };

  const updatedUsers = users.map((u) => (u.id === found.id ? updatedUser : u));
  saveUsers(updatedUsers);

  return { success: true, user: updatedUser };
}

export function hasUserPermission(
  user: AppUser | null,
  permission: AppPermission
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true; // Admins inherently have full access
  return user.permissions.includes(permission);
}

export function addUser(newUser: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
  const users = getStoredUsers();
  const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const userToSave: AppUser = {
    ...newUser,
    id,
    createdAt: new Date().toISOString(),
  };

  const nextList = [...users, userToSave];
  saveUsers(nextList);
  return userToSave;
}

export function updateUser(
  id: string,
  changes: Partial<Omit<AppUser, 'id' | 'createdAt'>>
): AppUser | null {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const current = users[index];
  const updated: AppUser = {
    ...current,
    ...changes,
  };

  users[index] = updated;
  saveUsers([...users]);

  // If current logged-in user updated themselves, sync session
  const active = getCurrentUser();
  if (active && active.id === id) {
    setCurrentUserSession(updated, true);
  }

  return updated;
}

export function deleteUser(id: string): boolean {
  const users = getStoredUsers();
  // Protect the initial main admin from being deleted
  if (id === 'user-admin') {
    return false;
  }
  const filtered = users.filter((u) => u.id !== id);
  saveUsers(filtered);
  return true;
}

/**
 * Synchronizes users with Supabase using resilient multi-tier fallback:
 * 1. checks dedicated 'app_users' table if it exists
 * 2. or syncs with 'players' table using id '__users_config__'
 */
export async function syncUsersWithSupabase(): Promise<AppUser[]> {
  const localUsers = getStoredUsers();
  if (!IS_SUPABASE_CONNECTED) return localUsers;

  try {
    // Attempt to read from dedicated table first
    const { data: dedicatedData, error: dedicatedErr } = await supabase
      .from('app_users')
      .select('*');

    if (!dedicatedErr && dedicatedData && dedicatedData.length > 0) {
      const parsed: AppUser[] = dedicatedData.map((row: any) => ({
        id: row.id,
        username: row.username,
        fullName: row.full_name || row.username,
        email: row.email,
        role: row.role || 'staff',
        roleTitle: row.role_title || ROLE_PRESETS[row.role as keyof typeof ROLE_PRESETS]?.title || 'Staff',
        password: row.password || '1234',
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        createdAt: row.created_at || new Date().toISOString(),
        lastLoginAt: row.last_login_at,
        isActive: row.is_active ?? true,
      }));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }

    // Fallback: use __users_config__ in players table
    const { data: configData, error: configErr } = await supabase
      .from('players')
      .select('data')
      .eq('id', '__users_config__')
      .maybeSingle();

    if (!configErr && configData?.data?.users && Array.isArray(configData.data.users)) {
      const cloudUsers = configData.data.users as AppUser[];
      if (cloudUsers.length > 0) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudUsers));
        return cloudUsers;
      }
    }

    // If cloud is empty, upload local users so cloud has them immediately
    saveUsersToSupabase(localUsers).catch(() => {});
    return localUsers;
  } catch (err) {
    console.warn('Error synchronizing users with Supabase:', err);
    return localUsers;
  }
}

export async function saveUsersToSupabase(users: AppUser[]): Promise<boolean> {
  if (!IS_SUPABASE_CONNECTED) return true;

  try {
    // 1. Try upserting to players table config record
    const payload = {
      id: '__users_config__',
      full_name: 'Configuración de Usuarios y Permisos',
      submitted_at: new Date().toISOString(),
      staff_notes: 'Sistema - Cuentas de Acceso y Roles',
      data: { users },
    };

    await supabase.from('players').upsert(payload, { onConflict: 'id' });

    // 2. Also try dedicated app_users table if it exists (won't throw fatal if not created)
    try {
      const rows = users.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        email: u.email || null,
        role: u.role,
        role_title: u.roleTitle,
        password: u.password,
        permissions: u.permissions,
        is_active: u.isActive,
        last_login_at: u.lastLoginAt || null,
      }));
      await supabase.from('app_users').upsert(rows, { onConflict: 'id' });
    } catch {}

    return true;
  } catch (err) {
    console.warn('Could not save users to Supabase:', err);
    return false;
  }
}
