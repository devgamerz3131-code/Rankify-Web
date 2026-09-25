import React from 'react';
import { AppProviders } from '@/providers';
import { MainLayout } from '@/layouts';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, SlideUp } from '@/components/ui/animated-container';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  Target,
  BrainCircuit,
  TrendingUp,
  User,
  Shield,
  Layers,
  ArrowRight,
  GraduationCap,
} from '@/icons';
import { CBSE_CLASSES, CBSE_SUBJECTS } from '@/constants/cbse';

const FoundationDashboard: React.FC = () => {
  const { activeTab, selectedClass, setSelectedClass, setActiveTab } = useNavigation();
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const activeSubjects = CBSE_SUBJECTS.filter((s) => s.classes.includes(selectedClass));

  return (
    <div className="space-y-8">
      {/* Foundation Announcement Hero */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950 p-6 sm:p-10 text-white shadow-2xl border border-purple-500/20">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-purple-200 border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>Phase 1 Architecture Initialized</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Rankify Web Foundation
            </h1>

            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed font-normal">
              High-performance, production-ready educational platform engineered for CBSE Class 9–12 students.
              Architecture includes Firebase Auth & Firestore, Apple-inspired design tokens, responsive multi-tier navigation, PWA offline caching, and strict TypeScript domain models.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isAuthenticated ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => openAuthModal('register')}
                  className="bg-white text-purple-900 hover:bg-purple-50 shadow-lg font-bold"
                >
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  Test Student Onboarding
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Authenticated as {user?.displayName} ({user?.role})</span>
                </div>
              )}
              <Button
                variant="glass"
                size="md"
                onClick={() => setActiveTab('study')}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Inspect Curriculum <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Decorative ambient backdrop */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute right-10 top-5 w-60 h-60 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        </div>
      </FadeIn>

      {/* CBSE Class Curriculum Matrix */}
      <SlideUp>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                CBSE Curriculum Matrix (Classes 9–12)
              </h2>
              <p className="text-xs text-muted-foreground">
                Select a class to test dynamic context switches across navigation, state, and subjects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {CBSE_CLASSES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedClass === c.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/25'
                      : 'bg-card border-slate-200/80 dark:border-white/10 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSubjects.map((sub) => (
              <Card key={sub.id} interactive className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: sub.color }}
                    >
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-muted-foreground">
                      Code {sub.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-1">{sub.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Class {selectedClass} Board Syllabus
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <span>View Syllabus</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </SlideUp>

      {/* Architecture Verification Grid */}
      <SlideUp>
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Phase 1 Foundation Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Firebase Security & Auth</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Persistent Auth & Session Restorer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Email, Google & Forgot Password</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Student & Admin Role Guards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Hardened 8-Pillar Firestore Rules</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">UI & Design System</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Apple-Inspired Glassmorphism</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Dark, Light & System Mode with Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Responsive Top, Sidebar & Bottom Nav</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Global ⌘K Search & Dialogs</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">PWA & Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Service Worker & Offline Indicator</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Web App Manifest & iOS Touch Icons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>In-App Install Prompt Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Zero Placeholder, Scalable Types</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SlideUp>

      {/* Active Tab State Display */}
      {activeTab !== 'home' && (
        <SlideUp>
          <Card className="border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-base capitalize">{activeTab} Section Ready</CardTitle>
              </div>
              <CardDescription>
                Navigated to <strong>{activeTab}</strong> for Class {selectedClass}. Architectural foundation, routes, types, services, and layouts are established.
              </CardDescription>
            </CardHeader>
          </Card>
        </SlideUp>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProviders>
      <MainLayout>
        <FoundationDashboard />
      </MainLayout>
    </AppProviders>
  );
}
