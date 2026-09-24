import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlayerData, FormStep, INITIAL_PLAYER_DATA, ClubProfile, DEFAULT_CLUB_PROFILE, AppUser } from './types';
import { Header } from './components/Header';
import { StepProgressBar } from './components/StepProgressBar';
import { Step1Personal } from './components/steps/Step1Personal';
import { Step2ExternalHelp } from './components/steps/Step2ExternalHelp';
import { Step3ABP } from './components/steps/Step3ABP';
import { Step4Psychology } from './components/steps/Step4Psychology';
import { Step5Commitment } from './components/steps/Step5Commitment';
import { Step6Goals } from './components/steps/Step6Goals';
import { Step7Summary } from './components/steps/Step7Summary';
import { SuccessView } from './components/SuccessView';
import { StaffDashboard } from './components/StaffDashboard';
import { UserPermissionsTab } from './components/UserPermissionsTab';
import { LoginScreen } from './components/LoginScreen';
import { ClubBadgeEditorModal } from './components/ClubBadgeEditorModal';
import { StaffPinModal } from './components/StaffPinModal';
import { useLanguage } from './context/LanguageContext';
import {
  getStoredPlayers,
  savePlayerSubmission,
  getFormDraft,
  saveFormDraft,
  clearFormDraft,
  getClubProfile,
  saveClubProfile,
  syncPlayersWithSupabase,
  syncClubProfileWithSupabase,
  isStaffSessionActive,
  setStaffSessionActive,
  clearStaffSession,
  syncStaffConfigWithSupabase,
} from './utils/storage';
import {
  getCurrentUser,
  setCurrentUserSession,
  logoutUser,
  getStoredUsers,
  syncUsersWithSupabase,
  hasUserPermission,
} from './utils/authStorage';
import { ConfirmModal } from './components/ConfirmModal';
import { ArrowLeft, ArrowRight, Shield, Check, RotateCcw } from 'lucide-react';

export default function App() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getCurrentUser());
  const [isDirectPlayerMode, setIsDirectPlayerMode] = useState(false);
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());

  const [activeView, setActiveView] = useState<'FORM' | 'STAFF' | 'USERS' | 'SUCCESS'>('FORM');
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [maxStepVisited, setMaxStepVisited] = useState<FormStep>(1);
  const [formData, setFormData] = useState<PlayerData>(INITIAL_PLAYER_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [submittedPlayer, setSubmittedPlayer] = useState<PlayerData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clubProfile, setClubProfile] = useState<ClubProfile>(DEFAULT_CLUB_PROFILE);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [pendingOpenClubEditor, setPendingOpenClubEditor] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    return isStaffSessionActive() || (Boolean(currentUser) && (currentUser?.role === 'admin' || currentUser?.role === 'coach' || currentUser?.role === 'staff'));
  });
  const [isStaffPinModalOpen, setIsStaffPinModalOpen] = useState(false);

  // Initialize data from local storage & Supabase
  useEffect(() => {
    const loadedPlayers = getStoredPlayers();
    setPlayers(loadedPlayers);
    setClubProfile(getClubProfile());
    setUsers(getStoredUsers());

    // Synchronize seamlessly with Supabase in the background
    syncPlayersWithSupabase().then(({ players: synced, source }) => {
      if (source === 'supabase' && synced) {
        setPlayers(synced);
      }
    });
    syncClubProfileWithSupabase().then((syncedProfile) => {
      if (syncedProfile) {
        setClubProfile(syncedProfile);
      }
    });
    syncStaffConfigWithSupabase().then(({ clubProfile: cp }) => {
      if (cp) {
        setClubProfile(cp);
      }
    });
    syncUsersWithSupabase().then((syncedUsers) => {
      if (syncedUsers && syncedUsers.length > 0) {
        setUsers(syncedUsers);
      }
    });

    const draft = getFormDraft();
    if (draft && draft.data) {
      const hasAnyData = Boolean(
        draft.data.fullName?.trim() ||
        draft.data.nickname?.trim() ||
        draft.data.phone?.trim() ||
        draft.data.email?.trim() ||
        draft.data.dorsal ||
        draft.step > 1
      );
      if (hasAnyData) {
        setFormData(draft.data);
        const validStep = Math.min(Math.max(draft.step || 1, 1), 7) as FormStep;
        setCurrentStep(validStep);
        setMaxStepVisited(validStep);
      }
    }
  }, []);

  // Compute permissions for current active user
  const canManageUsers = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_manage_users');
  const canViewDashboard = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_view_dashboard') || isStaffAuthenticated;
  const canDeletePlayers = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_delete_players');
  const canExportReports = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_export_reports');
  const canEditStaffNotes = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_edit_staff_notes');
  const canManageClub = currentUser?.role === 'admin' || hasUserPermission(currentUser, 'can_manage_club');

  // Determine if there is draft data that can be reset
  const hasDraft = Boolean(
    formData.fullName.trim() ||
    formData.nickname?.trim() ||
    formData.phone?.trim() ||
    formData.email?.trim() ||
    formData.dorsal ||
    formData.position ||
    currentStep > 1
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoginSuccess = (user: AppUser, remember: boolean) => {
    setCurrentUser(user);
    setCurrentUserSession(user, remember);
    setIsDirectPlayerMode(false);

    if (user.role === 'admin' || hasUserPermission(user, 'can_view_dashboard')) {
      setIsStaffAuthenticated(true);
      setStaffSessionActive(remember);
      setActiveView('STAFF');
    } else {
      setActiveView('FORM');
    }

    showToast(
      language === 'en'
        ? `Welcome back, ${user.fullName}!`
        : `¡Bienvenido/a, ${user.fullName}!`
    );
  };

  const handleDirectPlayerAccess = () => {
    setIsDirectPlayerMode(true);
    setActiveView('FORM');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsDirectPlayerMode(false);
    setIsStaffAuthenticated(false);
    clearStaffSession();
    setActiveView('FORM');
    showToast(
      language === 'en'
        ? 'Session closed successfully.'
        : 'Sesión cerrada correctamente.'
    );
  };

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = t.validation.fullNameRequired;
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t.validation.phoneRequired;
      }
      if (formData.email.trim() && !formData.email.includes('@')) {
        newErrors.email = t.validation.emailValid;
      }
    }

    if (step === 6) {
      if (!formData.individualGoal.trim()) {
        newErrors.individualGoal = t.validation.individualGoalRequired;
      }
      if (!formData.collectiveGoal.trim()) {
        newErrors.collectiveGoal = t.validation.collectiveGoalRequired;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const next = (currentStep + 1) as FormStep;
    if (next <= 7) {
      setCurrentStep(next);
      setMaxStepVisited((prev) => Math.max(prev, next) as FormStep);
      saveFormDraft(formData, next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    const prev = (currentStep - 1) as FormStep;
    if (prev >= 1) {
      setCurrentStep(prev);
      saveFormDraft(formData, prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep = (step: FormStep) => {
    if (step > currentStep) {
      if (!validateStep(currentStep)) return;
    }
    setCurrentStep(step);
    saveFormDraft(formData, step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = () => {
    // Validate all steps 1 through 6
    for (let s = 1; s <= 6; s++) {
      if (!validateStep(s as FormStep)) {
        setCurrentStep(s as FormStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setIsSubmitting(true);
    const finalPlayer: PlayerData = {
      ...formData,
      id: formData.id || `player-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      const updatedList = savePlayerSubmission(finalPlayer);
      setPlayers(updatedList);
      setSubmittedPlayer(finalPlayer);

      // Reset draft to clean form
      clearFormDraft();
      setFormData(INITIAL_PLAYER_DATA);
      setCurrentStep(1);
      setMaxStepVisited(1);
      setErrors({});

      setIsSubmitting(false);
      setActiveView('SUCCESS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const handleOpenResetModal = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    clearFormDraft();
    setFormData(INITIAL_PLAYER_DATA);
    setCurrentStep(1);
    setMaxStepVisited(1);
    setErrors({});
    setIsResetConfirmOpen(false);
    showToast(language === 'en' ? 'Form cleared and reset to blank.' : 'Formulario restablecido en blanco.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectView = (view: 'FORM' | 'STAFF' | 'USERS') => {
    if (view === 'STAFF') {
      if (!canViewDashboard) {
        setIsStaffPinModalOpen(true);
        return;
      }
    }
    if (view === 'USERS') {
      if (!canManageUsers) {
        showToast(
          language === 'en'
            ? 'You do not have permission to manage users.'
            : 'No tienes permisos para gestionar usuarios.'
        );
        return;
      }
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStaffPinSuccess = (rememberDevice: boolean = true) => {
    setIsStaffAuthenticated(true);
    setStaffSessionActive(rememberDevice);
    setIsStaffPinModalOpen(false);
    if (pendingOpenClubEditor) {
      setPendingOpenClubEditor(false);
      setIsClubModalOpen(true);
    } else {
      setActiveView('STAFF');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockStaff = () => {
    setIsStaffAuthenticated(false);
    clearStaffSession();
    setActiveView('FORM');
    showToast(
      language === 'en'
        ? 'Coaching Staff session locked and dashboard protected.'
        : 'Sesión del Cuerpo Técnico cerrada y panel protegido.'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenClubEditor = () => {
    if (!canManageClub && !isStaffAuthenticated) {
      setPendingOpenClubEditor(true);
      setIsStaffPinModalOpen(true);
      return;
    }
    setIsClubModalOpen(true);
  };

  const handleSaveClubProfile = (newProfile: ClubProfile) => {
    setClubProfile(newProfile);
    saveClubProfile(newProfile);
    showToast(
      language === 'en'
        ? 'Club crest and identity updated.'
        : 'Escudo e identidad del club actualizados.'
    );
  };

  // If no user is authenticated and not in direct player access mode, show Login Screen
  if (!currentUser && !isDirectPlayerMode) {
    return (
      <LoginScreen
        clubProfile={clubProfile}
        onLoginSuccess={handleLoginSuccess}
        onDirectPlayerAccess={handleDirectPlayerAccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col border-4 sm:border-8 border-red-600 print:border-none selection:bg-red-600 selection:text-white">
      {/* Club Staff Header */}
      <Header
        activeView={activeView === 'STAFF' ? 'STAFF' : activeView === 'USERS' ? 'USERS' : 'FORM'}
        onSelectView={handleSelectView}
        playerCount={players.length}
        hasDraft={hasDraft}
        onResetDraft={handleOpenResetModal}
        clubProfile={clubProfile}
        onOpenClubEditor={handleOpenClubEditor}
        isStaffAuthenticated={canViewDashboard}
        onLockStaff={handleLockStaff}
        currentUser={currentUser}
        canManageUsers={canManageUsers}
        onLogout={handleLogout}
      />

      {/* VIEW: STAFF DASHBOARD */}
      {activeView === 'STAFF' && (
        <main className="flex-1 bg-white">
          <StaffDashboard
            players={players}
            onUpdatePlayers={setPlayers}
            onBackToPlayerForm={() => setActiveView('FORM')}
            onLockStaff={handleLockStaff}
            onOpenClubEditor={handleOpenClubEditor}
            onOpenUserPermissions={() => handleSelectView('USERS')}
            canManageUsers={canManageUsers}
            canDeletePlayers={canDeletePlayers}
            canExportReports={canExportReports}
            canEditStaffNotes={canEditStaffNotes}
          />
        </main>
      )}

      {/* VIEW: USERS & PERMISSIONS MANAGEMENT TAB */}
      {activeView === 'USERS' && (
        <main className="flex-1 bg-slate-50/50">
          <UserPermissionsTab
            users={users}
            onUpdateUsers={setUsers}
            currentUser={currentUser}
            onShowToast={showToast}
          />
        </main>
      )}

      {/* VIEW: SUCCESS SCREEN */}
      {activeView === 'SUCCESS' && submittedPlayer && (
        <main className="flex-1 bg-white">
          <SuccessView
            player={submittedPlayer}
          />
        </main>
      )}

      {/* VIEW: MULTI-STEP PLAYER FORM */}
      {activeView === 'FORM' && (
        <main className="flex-1 flex flex-col bg-white">
          {/* Top Progress Bar */}
          <StepProgressBar
            currentStep={currentStep}
            onSelectStep={handleGoToStep}
            maxStepVisited={maxStepVisited}
          />

          {/* Privacy Context Banner */}
          <div className="max-w-3xl mx-auto w-full px-4 pt-3 pb-1">
            <div className="flex items-center justify-between gap-1.5 text-xs py-1">
              <span className="text-[11px] text-slate-500">
                {t.nav.privacyNotice}
              </span>
            </div>
          </div>

          {/* Step Form Container */}
          <div className={`flex-1 w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 transition-all duration-300 ${
            currentStep === 4 || currentStep === 7 ? 'max-w-5xl' : 'max-w-3xl'
          }`}>
            <div className="bg-white border-2 border-red-500 rounded-3xl p-5 sm:p-8 shadow-xl shadow-red-950/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <Step1Personal
                      data={formData}
                      errors={errors}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 1);
                      }}
                    />
                  )}
                  {currentStep === 2 && (
                    <Step2ExternalHelp
                      data={formData}
                      errors={errors}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 2);
                      }}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3ABP
                      data={formData}
                      errors={errors}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 3);
                      }}
                    />
                  )}
                  {currentStep === 4 && (
                    <Step4Psychology
                      data={formData}
                      errors={errors}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 4);
                      }}
                    />
                  )}
                  {currentStep === 5 && (
                    <Step5Commitment
                      data={formData}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 5);
                      }}
                    />
                  )}
                  {currentStep === 6 && (
                    <Step6Goals
                      data={formData}
                      errors={errors}
                      onChange={(updated) => {
                        const merged = { ...formData, ...updated };
                        setFormData(merged);
                        saveFormDraft(merged, 6);
                      }}
                    />
                  )}
                  {currentStep === 7 && (
                    <Step7Summary
                      data={formData}
                      onGoToStep={(step) => {
                        setCurrentStep(step);
                        saveFormDraft(formData, step);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons Row */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    id="btn-nav-prev-step"
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t.nav.prevStep}</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    id="btn-nav-next-step"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <span>{currentStep === 6 ? t.nav.reviewSummary : t.nav.nextStep}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-nav-submit-form"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-7 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm sm:text-base font-black shadow-xl shadow-red-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t.step7.submittingBtn}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>{t.step7.submitBtn}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Form Draft Reset Link */}
              {hasDraft && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    id="btn-reset-draft"
                    onClick={handleOpenResetModal}
                    className="text-xs text-slate-500 hover:text-red-600 py-2 px-3 rounded-lg hover:bg-red-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.nav.startOverDraft}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* In-app Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title={t.modals.resetConfirmTitle}
        message={t.modals.resetConfirmMessage}
        confirmLabel={t.modals.resetConfirmBtn}
        cancelLabel={t.common.cancel}
        variant="reset"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Club Badge and Identity Customizer Modal */}
      <ClubBadgeEditorModal
        isOpen={isClubModalOpen}
        onClose={() => setIsClubModalOpen(false)}
        currentProfile={clubProfile}
        onSave={handleSaveClubProfile}
      />

      {/* Staff Security PIN Modal (protects Staff Dashboard) */}
      <StaffPinModal
        isOpen={isStaffPinModalOpen}
        onClose={() => {
          setIsStaffPinModalOpen(false);
          setPendingOpenClubEditor(false);
        }}
        onSuccess={handleStaffPinSuccess}
      />

      {/* Feedback Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-white border-2 border-red-500 text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Sports Footer */}
      <footer className="border-t border-red-200 bg-slate-50 py-4 px-4 text-center text-xs text-slate-600 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>{t.nav.footerTitle}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            {t.nav.footerSubtitle}
          </p>
        </div>
      </footer>
    </div>
  );
}
