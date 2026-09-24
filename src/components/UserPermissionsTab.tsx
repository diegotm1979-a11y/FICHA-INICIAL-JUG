import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { UserEditModal } from './UserEditModal';
import { ConfirmModal } from './ConfirmModal';
import { addUser, updateUser, deleteUser } from '../utils/authStorage';

interface UserPermissionsTabProps {
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
  currentUser: AppUser | null;
  onShowToast: (msg: string) => void;
}

export const UserPermissionsTab: React.FC<UserPermissionsTabProps> = ({
  users,
  onUpdateUsers,
  currentUser,
  onShowToast,
}) => {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const staffUsers = users.filter((u) => u.role === 'coach' || u.role === 'staff' || u.role === 'analyst').length;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.roleTitle.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesQuery && matchesRole;
  });

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = (data: Omit<AppUser, 'createdAt'>) => {
    if (editingUser) {
      // Update existing
      updateUser(editingUser.id, data);
      onShowToast(t.userManagement.userSavedToast);
    } else {
      // Add new
      addUser(data);
      onShowToast(t.userManagement.userSavedToast);
    }
    // Refresh list from storage
    const updated = (window as any).localStorage.getItem('ficha_inicial_app_users_v1');
    if (updated) {
      try {
        onUpdateUsers(JSON.parse(updated));
      } catch {}
    }
    setIsEditModalOpen(false);
  };

  const handleToggleActive = (user: AppUser) => {
    if (user.id === 'user-admin') {
      onShowToast(t.userManagement.cannotDeleteAdmin);
      return;
    }
    const nextStatus = !user.isActive;
    updateUser(user.id, { isActive: nextStatus });
    onUpdateUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u)));
    onShowToast(
      nextStatus
        ? isEn
          ? `Account for @${user.username} activated.`
          : `Cuenta de @${user.username} activada.`
        : isEn
        ? `Account for @${user.username} deactivated.`
        : `Cuenta de @${user.username} desactivada.`
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.id === 'user-admin') {
      onShowToast(t.userManagement.cannotDeleteAdmin);
      setDeletingUser(null);
      return;
    }
    deleteUser(deletingUser.id);
    onUpdateUsers(users.filter((u) => u.id !== deletingUser.id));
    onShowToast(t.userManagement.userDeletedToast);
    setDeletingUser(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'coach':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'staff':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'analyst':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'player':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-3xl border-2 border-red-500 p-5 sm:p-6 shadow-xl shadow-red-950/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/30">
            <Shield className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.userManagement.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {t.userManagement.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-add-new-user"
          onClick={handleOpenNewUser}
          className="self-start md:self-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.userManagement.addUserBtn}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.userManagement.totalUsers}
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              {t.userManagement.activeUsers}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeUsers}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {t.userManagement.adminsCount}
            </span>
            <Shield className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-1">{adminUsers}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              {t.userManagement.staffCount}
            </span>
            <Sparkles className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-sky-700 mt-1">{staffUsers}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.userManagement.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-0.5" />
          {[
            { key: 'ALL', label: t.userManagement.filterAll },
            { key: 'admin', label: 'Admin / DT' },
            { key: 'coach', label: 'Entrenadores' },
            { key: 'staff', label: 'Staff Físico' },
            { key: 'player', label: 'Jugadores' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === f.key
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List Table / Responsive Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 sm:px-6">{t.userManagement.colUser}</th>
                <th className="py-3 px-4">{t.userManagement.colRole}</th>
                <th className="py-3 px-4 hidden md:table-cell">{t.userManagement.colPermissions}</th>
                <th className="py-3 px-4">{t.userManagement.colStatus}</th>
                <th className="py-3 px-4 hidden lg:table-cell">{t.userManagement.colLastLogin}</th>
                <th className="py-3 px-4 sm:px-6 text-right">{t.userManagement.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold">
                      {isEn ? 'No user accounts match your search.' : 'No hay usuarios que coincidan con la búsqueda.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  const isMainAdmin = user.id === 'user-admin';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {user.fullName}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                  {isEn ? 'You' : 'Tú'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>@{user.username}</span>
                              {user.email && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[150px]">{user.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium line-clamp-1">
                            {user.roleTitle}
                          </span>
                        </div>
                      </td>

                      {/* Permissions */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {user.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-bold border border-red-200 flex items-center gap-1">
                              <Shield className="w-3 h-3 text-red-600" />
                              <span>{isEn ? 'Full Access (All Permissions)' : 'Acceso Total (Todos)'}</span>
                            </span>
                          ) : (
                            <>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                                {user.permissions?.length || 0}{' '}
                                {isEn ? 'active permissions' : 'permisos activos'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(user)}
                                className="text-[11px] text-red-600 hover:text-red-700 hover:underline font-semibold ml-1 cursor-pointer"
                              >
                                {isEn ? 'Configure' : 'Configurar'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isMainAdmin}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            user.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          } ${isMainAdmin ? 'opacity-80 cursor-default' : ''}`}
                          title={
                            isMainAdmin
                              ? t.userManagement.cannotDeleteAdmin
                              : isEn
                              ? 'Click to toggle status'
                              : 'Clic para alternar estado'
                          }
                        >
                          {user.isActive ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{t.userManagement.statusActive}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span>{t.userManagement.statusInactive}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-slate-500">
                        {user.lastLoginAt ? (
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            {t.userManagement.neverLoggedIn}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Permissions / User button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={t.userManagement.editPermissions}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={t.userManagement.editUser}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title={t.userManagement.deleteUser}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User & Permissions Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        onSave={handleSaveUser}
        isCurrentLoggedUser={currentUser?.id === editingUser?.id}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingUser)}
        title={t.userManagement.deleteConfirmTitle}
        message={t.userManagement.deleteConfirmMessage.replace(
          '{name}',
          deletingUser ? `${deletingUser.fullName} (@${deletingUser.username})` : ''
        )}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};
