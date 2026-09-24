import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Check,
  KeyRound,
  User,
  Mail,
  Lock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AppUser, AppPermission, UserRole, ROLE_PRESETS } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null; // null means create new user
  onSave: (user: Omit<AppUser, 'createdAt'>) => void;
  isCurrentLoggedUser: boolean;
}

const ALL_PERMISSIONS: AppPermission[] = [
  'can_fill_form',
  'can_view_dashboard',
  'can_view_player_details',
  'can_edit_staff_notes',
  'can_export_reports',
  'can_delete_players',
  'can_manage_club',
  'can_manage_users',
];

export const UserEditModal: React.FC<UserEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isCurrentLoggedUser,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('coach');
  const [roleTitle, setRoleTitle] = useState('');
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setUsername(user.username);
      setEmail(user.email || '');
      setPassword(user.password);
      setRole(user.role);
      setRoleTitle(user.roleTitle);
      setPermissions(user.permissions || []);
      setIsActive(user.isActive ?? true);
    } else {
      // New user defaults
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('1234');
      setRole('coach');
      setRoleTitle(ROLE_PRESETS.coach.title);
      setPermissions([...ROLE_PRESETS.coach.defaultPermissions]);
      setIsActive(true);
    }
    setError(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setRoleTitle(ROLE_PRESETS[newRole].title);
    setPermissions([...ROLE_PRESETS[newRole].defaultPermissions]);
  };

  const handleTogglePermission = (perm: AppPermission) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSelectAll = () => {
    setPermissions([...ALL_PERMISSIONS]);
  };

  const handleDeselectAll = () => {
    setPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError(isEn ? 'Full name is required.' : 'El nombre y apellidos son obligatorios.');
      return;
    }
    if (!username.trim()) {
      setError(isEn ? 'Username is required.' : 'El nombre de usuario es obligatorio.');
      return;
    }
    if (!password.trim() || password.length < 3) {
      setError(isEn ? 'Password must be at least 3 characters.' : 'La contraseña debe tener al menos 3 caracteres.');
      return;
    }

    onSave({
      id: user ? user.id : `user-${Date.now()}`,
      fullName: fullName.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, ''),
      email: email.trim() || undefined,
      password: password.trim(),
      role,
      roleTitle: roleTitle.trim() || ROLE_PRESETS[role].title,
      permissions,
      isActive,
      lastLoginAt: user?.lastLoginAt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border-2 border-red-500 shadow-2xl w-full max-w-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md shadow-red-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {user ? t.userManagement.modalEditTitle : t.userManagement.modalNewTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {user
                  ? isEn
                    ? `Configuring permissions for @${user.username}`
                    : `Configurando permisos para @${user.username}`
                  : isEn
                  ? 'Add a new member to the technical team'
                  : 'Añadir un nuevo miembro al equipo técnico'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Identity Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.userManagement.fullNameLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.userManagement.fullNamePlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.userManagement.usernameLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.userManagement.usernamePlaceholder}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.userManagement.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.userManagement.emailPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.userManagement.passwordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.userManagement.passwordPlaceholder}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono font-medium"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{t.userManagement.passwordHelp}</span>
            </div>
          </div>

          {/* Role & Position Presets */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>{t.userManagement.roleLabel}</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {isEn ? 'Sets default recommended permissions' : 'Aplica los permisos recomendados'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(ROLE_PRESETS) as UserRole[]).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-600/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'admin' && (isEn ? 'Admin' : 'Admin / DT')}
                    {r === 'coach' && (isEn ? 'Coach' : '2º Entrenador')}
                    {r === 'staff' && (isEn ? 'Staff' : 'Físico / Staff')}
                    {r === 'analyst' && (isEn ? 'Analyst' : 'Analista')}
                    {r === 'player' && (isEn ? 'Player' : 'Jugador')}
                  </button>
                );
              })}
            </div>

            {/* Custom Role Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t.userManagement.roleTitleLabel}
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder={t.userManagement.roleTitlePlaceholder}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 font-medium bg-white"
              />
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-red-600" />
                  <span>{t.userManagement.permissionsSectionTitle}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {permissions.length} / {ALL_PERMISSIONS.length}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.userManagement.permissionsSectionSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                >
                  {t.userManagement.selectAll}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                >
                  {t.userManagement.deselectAll}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_PERMISSIONS.map((perm) => {
                const isGranted = permissions.includes(perm);
                const label = t.userManagement.permissionLabels[perm] || perm;
                const description = t.userManagement.permissionDescriptions[perm] || '';

                return (
                  <div
                    key={perm}
                    onClick={() => handleTogglePermission(perm)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isGranted
                        ? 'bg-red-50/60 border-red-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isGranted
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isGranted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex-1">
                      <span className={`block text-xs font-bold ${isGranted ? 'text-red-950' : 'text-slate-700'}`}>
                        {label}
                      </span>
                      <span className="block text-[11px] text-slate-500 leading-tight mt-0.5">
                        {description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t.userManagement.activeAccountLabel}
              </span>
              <span className="text-[11px] text-slate-500">
                {isEn
                  ? 'Deactivating an account blocks login immediately.'
                  : 'Desactivar la cuenta impide que el usuario inicie sesión.'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                disabled={isCurrentLoggedUser && user?.role === 'admin'}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
