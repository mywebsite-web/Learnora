/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { MainDashboard } from './components/MainDashboard';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AiRobotMascot } from './components/AiRobotMascot';
import { SuspendedAccountModal } from './components/SuspendedAccountModal';
import { DeletedAccountNoticeModal } from './components/DeletedAccountNoticeModal';
import { MaintenanceService } from './services/maintenanceService';
import { MaintenanceScreenModal } from './components/MaintenanceScreenModal';
import { MaintenanceModeConfig, isAdminEmail } from './types';

function AppContent() {
  const { user, profile, loading, suspendedNotice, clearSuspendedNotice, deletedNotice, clearDeletedNotice } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [rerunSetup, setRerunSetup] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceModeConfig>(MaintenanceService.getLocalConfig());

  // Listen to platform maintenance status in real-time
  useEffect(() => {
    const unsubscribe = MaintenanceService.subscribeToMaintenance((cfg) => {
      setMaintenanceConfig(cfg);
    });
    return () => unsubscribe();
  }, []);

  const isUnderMaintenance = maintenanceConfig.isActive && !isAdminEmail(user?.email);

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-blue-50/50 to-slate-100 p-4 font-sans select-none">
        <div className="flex flex-col items-center max-w-sm w-full text-center">
          {/* Nora Bot Mascot with radiant ambient glow and floating animation */}
          <div className="relative mb-3 flex items-center justify-center">
            {/* Ambient soft glow aura */}
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-400/30 via-indigo-400/25 to-sky-400/30 rounded-full blur-2xl animate-pulse" />
            
            {/* Floating Nora Mascot */}
            <div className="relative animate-float-bot">
              <AiRobotMascot variant="waving" size={150} showBubble={true} />
            </div>
          </div>

          {/* Nora AI Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Nora AI Study Companion</span>
          </div>

          {/* Title & Microcopy */}
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
            Setting up your Learnora workspace...
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-xs mb-4">
            Preparing your interactive notes, audio lessons, and personal AI tutor
          </p>

          {/* Shimmer Progress Track */}
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 rounded-full w-24 animate-loading-bar" />
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connecting to neural cognitive core</span>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in: show Landing Page with Auth modal
  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onSignIn={() => {
            setAuthModalMode('signin');
            setAuthModalOpen(true);
          }}
        />
        {authModalOpen && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => setAuthModalOpen(false)}
          />
        )}
        {suspendedNotice && (
          <SuspendedAccountModal
            notice={suspendedNotice}
            onDismiss={clearSuspendedNotice}
          />
        )}
        {deletedNotice && (
          <DeletedAccountNoticeModal
            notice={deletedNotice}
            onDismiss={clearDeletedNotice}
          />
        )}
        {isUnderMaintenance && (
          <MaintenanceScreenModal
            config={maintenanceConfig}
            onRefreshStatus={() => {
              MaintenanceService.getConfig().then(setMaintenanceConfig);
            }}
          />
        )}
      </>
    );
  }

  // User is signed in: check if they need to complete the 6-stage Learnora setup
  if (user && profile && (!profile.onboardingCompleted || rerunSetup)) {
    return (
      <>
        <OnboardingWizard 
          onComplete={() => {
            setRerunSetup(false);
          }} 
        />
        {suspendedNotice && (
          <SuspendedAccountModal
            notice={suspendedNotice}
            onDismiss={clearSuspendedNotice}
          />
        )}
        {deletedNotice && (
          <DeletedAccountNoticeModal
            notice={deletedNotice}
            onDismiss={clearDeletedNotice}
          />
        )}
        {isUnderMaintenance && (
          <MaintenanceScreenModal
            config={maintenanceConfig}
            onRefreshStatus={() => {
              MaintenanceService.getConfig().then(setMaintenanceConfig);
            }}
          />
        )}
      </>
    );
  }

  // User is signed in and has completed setup: show MainDashboard with the new Figma-inspired layout
  return (
    <>
      <MainDashboard 
        onRerunSetup={() => setRerunSetup(true)}
      />
      {suspendedNotice && (
        <SuspendedAccountModal
          notice={suspendedNotice}
          onDismiss={clearSuspendedNotice}
        />
      )}
      {deletedNotice && (
        <DeletedAccountNoticeModal
          notice={deletedNotice}
          onDismiss={clearDeletedNotice}
        />
      )}
      {isUnderMaintenance && (
        <MaintenanceScreenModal
          config={maintenanceConfig}
          onRefreshStatus={() => {
            MaintenanceService.getConfig().then(setMaintenanceConfig);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
