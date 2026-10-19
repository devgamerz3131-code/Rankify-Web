import React from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Sliders,
  Palette,
  Eye,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Box,
  Maximize2,
  Check,
  Shield,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import {
  UiPreset,
  RadiusPreset,
  AnimationLevel,
  CardDensity,
  ShadowIntensity,
  BackgroundStyle,
  AccentColor,
  IconStyle,
  FontSize,
  UiScale,
  PerformanceMode,
} from '@/types/theme';
import toast from 'react-hot-toast';

export const AppearanceLabView: React.FC = () => {
  const {
    theme,
    setTheme,
    appearance,
    updateAppearance,
    applyPreset,
    resetAppearance,
    saveAsAdminDefault,
  } = useTheme();

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const PRESETS: { id: UiPreset; label: string; desc: string }[] = [
    { id: 'Minimal', label: 'Minimal', desc: 'Pure flat solid surfaces, zero distraction, high focus' },
    { id: 'Material 3', label: 'Material 3', desc: 'Google M3 rounded contours, clean elevation, solid cards' },
    { id: 'Modern Flat', label: 'Modern Flat', desc: 'Crisp borders, vibrant solid accents' },
    { id: 'Professional', label: 'Professional', desc: 'Executive typography, subtle corporate solid palette' },
    { id: 'High Contrast', label: 'High Contrast', desc: 'Enhanced surface contrast, crisp borders for accessibility' },
  ];

  const ACCENTS: { id: AccentColor; label: string; colorClass: string; hex: string }[] = [
    { id: 'Purple', label: 'Purple', colorClass: 'bg-purple-600', hex: '#7c3aed' },
    { id: 'Blue', label: 'Blue', colorClass: 'bg-blue-600', hex: '#2563eb' },
    { id: 'Green', label: 'Green', colorClass: 'bg-emerald-600', hex: '#059669' },
    { id: 'Orange', label: 'Orange', colorClass: 'bg-amber-600', hex: '#d97706' },
    { id: 'Red', label: 'Red', colorClass: 'bg-rose-600', hex: '#e11d48' },
    { id: 'Pink', label: 'Pink', colorClass: 'bg-pink-600', hex: '#db2777' },
    { id: 'Teal', label: 'Teal', colorClass: 'bg-teal-600', hex: '#0d9488' },
    { id: 'Dynamic System Color', label: 'Adaptive', colorClass: 'bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500', hex: '#7c3aed' },
  ];

  const RADIUS_OPTIONS: RadiusPreset[] = ['Small', 'Medium', 'Large', 'Extra Large'];
  const DENSITY_OPTIONS: CardDensity[] = ['Compact', 'Comfortable', 'Spacious'];
  const SHADOW_OPTIONS: ShadowIntensity[] = ['Off', 'Soft', 'Medium', 'Strong'];
  const ANIM_OPTIONS: AnimationLevel[] = ['Off', 'Low', 'Normal', 'High', 'Ultra'];
  const BG_OPTIONS: BackgroundStyle[] = ['Solid', 'Subtle Surface', 'Gradient', 'Dynamic'];
  const ICON_OPTIONS: IconStyle[] = ['Rounded', 'Material', 'Modern'];
  const FONT_OPTIONS: FontSize[] = ['Small', 'Normal', 'Large', 'Extra Large'];
  const SCALE_OPTIONS: UiScale[] = ['90%', '100%', '110%', '125%'];
  const PERF_OPTIONS: PerformanceMode[] = ['Battery Saver', 'Balanced', 'Best Quality'];

  const handleReset = () => {
    resetAppearance();
    toast.success('Appearance reset to default settings');
  };

  const handleAdminSave = async () => {
    if (!saveAsAdminDefault) return;
    try {
      await saveAsAdminDefault();
      toast.success('Current appearance saved as default cohort theme!');
    } catch {
      toast.error('Failed to save cohort defaults');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Appearance & Theme</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Customize Your Study Space
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Customize surfaces, accent colors, corner curvature, text size, and display preferences. Changes save automatically across your devices.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </Button>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdminSave}
                className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Save Cohort Default</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          1. LIVE INTERACTIVE PREVIEW
          ======================================================== */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Live Comparison Preview</h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
            Live Preview • Instant Updates
          </span>
        </div>

        {/* Preview Sandbox */}
        <div className="p-6 rounded-xl border border-border bg-muted/60 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                {appearance.uiPreset} Preset
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Radius: {appearance.radiusPreset} • Density: {appearance.cardDensity}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-foreground">
              Electric Charges and Fields (Preview)
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Material 3 solid card preview reflecting your selected corner radius, density, and accent hues.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="primary" size="sm" className="rounded-xl text-xs font-bold gap-2">
              <span>Primary Button</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
              <span>Secondary</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ========================================================
          2. UI STYLE PRESETS (One-Tap Setup)
          ======================================================== */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-sm text-foreground">UI Style Presets</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const isSelected = appearance.uiPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 shadow-xs'
                    : 'border-border hover:border-purple-400 bg-card'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="font-bold text-sm text-foreground">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>
      {/* ========================================================
          3. ACCENT COLOR PALETTE
          ======================================================== */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Accent Color</h3>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            {appearance.accentColor}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {ACCENTS.map((acc) => {
            const isSelected = appearance.accentColor === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => updateAppearance({ accentColor: acc.id })}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 ring-2 ring-purple-500/40 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-border hover:border-slate-400 bg-card'
                }`}
              >
                <div className={`w-7 h-7 rounded-full ${acc.colorClass} shadow-xs flex items-center justify-center`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <span className="text-[10px] font-bold text-foreground truncate w-full text-center">
                  {acc.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ========================================================
          4. CORNER RADIUS & CARD DENSITY
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Corner Radius */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Corner Radius</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {RADIUS_OPTIONS.map((rad) => (
              <button
                key={rad}
                onClick={() => updateAppearance({ radiusPreset: rad })}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  appearance.radiusPreset === rad
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {rad}
              </button>
            ))}
          </div>
        </Card>

        {/* Card Density */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Card Density</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DENSITY_OPTIONS.map((dens) => (
              <button
                key={dens}
                onClick={() => updateAppearance({ cardDensity: dens })}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  appearance.cardDensity === dens
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {dens}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ========================================================
          5. SHADOW INTENSITY & BACKGROUND STYLE
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Shadow Intensity */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Shadow Intensity</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SHADOW_OPTIONS.map((sh) => (
              <button
                key={sh}
                onClick={() => updateAppearance({ shadowIntensity: sh })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  appearance.shadowIntensity === sh
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        </Card>

        {/* Background Style */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-foreground">Background Style</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BG_OPTIONS.map((bg) => (
              <button
                key={bg}
                onClick={() => updateAppearance({ backgroundStyle: bg })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer truncate ${
                  appearance.backgroundStyle === bg
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ========================================================
          6. FONT SIZE & UI SCALE
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Font Size */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground">Font Size Scale</h3>
          <div className="grid grid-cols-4 gap-2">
            {FONT_OPTIONS.map((fs) => (
              <button
                key={fs}
                onClick={() => updateAppearance({ fontSize: fs })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  appearance.fontSize === fs
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {fs}
              </button>
            ))}
          </div>
        </Card>

        {/* UI Scale */}
        <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-foreground">Interface Zoom Scale</h3>
          <div className="grid grid-cols-4 gap-2">
            {SCALE_OPTIONS.map((scale) => (
              <button
                key={scale}
                onClick={() => updateAppearance({ uiScale: scale })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  appearance.uiScale === scale
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ========================================================
          7. PERFORMANCE MODE & ACCESSIBILITY
          ======================================================== */}
      <Card className="p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-sm text-foreground">Performance & Motion Mode</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PERF_OPTIONS.map((perf) => (
            <button
              key={perf}
              onClick={() => updateAppearance({ performanceMode: perf })}
              className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                appearance.performanceMode === perf
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'border-border bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {perf}
            </button>
          ))}
        </div>

        {/* Accessibility Reduce Motion Toggle */}
        <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-foreground">Reduce Motion (Accessibility)</h4>
            <p className="text-[11px] text-muted-foreground">
              Disables animations and heavy transitions for students sensitive to motion.
            </p>
          </div>
          <button
            onClick={() => updateAppearance({ reduceMotion: !appearance.reduceMotion })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              appearance.reduceMotion ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs ${
                appearance.reduceMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
};
