import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { ClubProfile, AppUser } from '../types';
import { authenticateUser } from '../utils/authStorage';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface LoginScreenProps {
  clubProfile: ClubProfile;
  onLoginSuccess: (user: AppUser, remember: boolean) => void;
  onDirectPlayerAccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  clubProfile,
  onLoginSuccess,
  onDirectPlayerAccess,
}) => {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clubName = (clubProfile?.clubName || '').trim();
  const crestUrl = clubProfile?.crestUrl;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage(
        language === 'en'
          ? 'Please enter both username and password.'
          : 'Por favor, introduce usuario y contraseña.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = authenticateUser(username, password);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user, rememberMe);
      } else {
        setErrorMessage(
          res.error === 'Este usuario ha sido desactivado por el administrador'
            ? t.auth.loginErrorDeactivated
            : t.auth.loginErrorInvalid
        );
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Background Decorative Pitch Accents */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-600 filter blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-red-700 filter blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Top Bar with Language Selector */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black shadow-md shadow-red-600/30">
            {crestUrl ? (
              <img src={crestUrl} alt="Club Crest" className="w-6 h-6 object-contain" />
            ) : (
              <Shield className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 rounded-xl p-0.5 border border-slate-700">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card Container */}
          <div className="bg-white rounded-3xl border-2 border-red-500 shadow-2xl shadow-red-950/40 p-6 sm:p-8 text-slate-900">
            {/* Header / Brand */}
            <div className="text-center mb-6">
              <div className="inline-flex relative mb-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-xl shadow-red-600/30 p-2 overflow-hidden ring-4 ring-red-100">
                  {crestUrl ? (
                    <img src={crestUrl} alt="Club Crest" className="w-full h-full object-contain" />
                  ) : (
                    <Shield className="w-10 h-10 stroke-[2.2]" />
                  )}
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {clubName || t.auth.loginTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {t.auth.loginSubtitle}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200"
              >
                <div className="w-5 h-5 rounded-full bg-red-200 text-red-700 flex items-center justify-center shrink-0 font-bold">
                  !
                </div>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  {t.auth.usernameOrEmail}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.auth.usernamePlaceholder}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  {t.auth.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.auth.passwordPlaceholder}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span>{t.auth.rememberMe}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.auth.signingIn}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.auth.signIn}</span>
                  </>
                )}
              </button>
            </form>

            {/* Direct Player Form Access Link */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500 mb-1.5">
                {t.auth.directPlayerAccess}
              </p>
              <button
                type="button"
                id="btn-direct-player-access"
                onClick={onDirectPlayerAccess}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 py-1 px-3 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span>{t.auth.directPlayerButton}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Security footnote */}
          <div className="text-center mt-4 text-[11px] text-slate-400">
            <span>{t.auth.securityBadge}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 px-4 text-xs text-slate-500">
        <p>{t.nav.footerTitle}</p>
      </footer>
    </div>
  );
};
