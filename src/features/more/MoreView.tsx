import React from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Bookmark,
  Brain,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Settings,
  User,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { TOTAL_OFFICIAL_CHAPTERS } from '@/services/chapter-service';

export const MoreView: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'devgamerz3131@gmail.com';

  const coreTools = [
    {
      id: 'ncert',
      title: 'NCERT Smart Reader',
      shortLabel: 'NCERT',
      badge: 'Class 12 Syllabus',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description:
        'Line-by-line digital textbook reader for Class 12 Physics, Chemistry, and Mathematics. Includes highlighted NCERT formulas, key reactions, and smart definitions.',
      icon: BookOpen,
      iconBg: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      stats: `${TOTAL_OFFICIAL_CHAPTERS} Chapters Available`,
      actionText: 'Open NCERT Reader',
      tab: 'ncert' as const,
    },
    {
      id: 'mistakes',
      title: 'Mistake Notebook',
      shortLabel: 'Mistake Notebook',
      badge: 'AI Error Analytics',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description:
        'Log, tag, and review exam and practice errors. Automatically categorizes calculation slips, conceptual gaps, and formula recall issues to prevent repeat mistakes.',
      icon: Bookmark,
      iconBg: 'bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      stats: 'Smart Revision Loop',
      actionText: 'Open Mistake Notebook',
      tab: 'mistakes' as const,
    },
    {
      id: 'weakness',
      title: 'Weakness Analyzer',
      shortLabel: 'Weakness Radar',
      badge: 'Chapter Analysis',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      description:
        'Highlights low-accuracy chapters, high-weightage exam topics, and generates custom study plans.',
      icon: Brain,
      iconBg: 'bg-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      stats: 'Real-time Syllabus Radar',
      actionText: 'Open Weakness Analyzer',
      tab: 'weakness' as const,
    },
  ];

  const secondaryTools = [
    {
      id: 'halfyearly',
      title: 'Half-Yearly Performance Analyzer',
      description: 'Upload marks, analyze chapter mastery, and predict CBSE Board scores.',
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      tab: 'halfyearly' as const,
    },
    {
      id: 'settings',
      title: 'Notifications & App Settings',
      description: 'Configure study reminders, sound alerts, theme, and data preferences.',
      icon: Settings,
      color: 'text-indigo-600 dark:text-indigo-400',
      tab: 'settings' as const,
    },
    {
      id: 'profile',
      title: 'Student Academic Profile',
      description: 'Manage CBSE board credentials, stream info, target score, and streaks.',
      icon: User,
      color: 'text-emerald-600 dark:text-emerald-400',
      tab: 'profile' as const,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin',
            title: 'Admin Console & Cohorts',
            description: 'Manage users, syllabus configurations, and audit telemetry.',
            icon: Shield,
            color: 'text-amber-600 dark:text-amber-400',
            tab: 'admin' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 select-none animate-fadeIn">
      {/* Header */}
      <div className="border-b border-border pb-5 space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Study Resources & Tools</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          More Tools & Accelerators
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Quickly access the NCERT Digital Library, Mistake Notebook, Weakness Analyzer, and academic utilities.
        </p>
      </div>

      {/* Primary 3 Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Core Accelerated Modules</span>
          </h2>
          <span className="text-[11px] font-semibold text-muted-foreground font-mono">
            3 Primary Tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {coreTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="h-full p-5 sm:p-6 bg-card border border-border rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md hover:border-purple-500/40 transition-all group">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${tool.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${tool.badgeColor}`}
                      >
                        {tool.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 space-y-3 border-t border-slate-100 dark:border-white/5 mt-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-medium">Status</span>
                      <span className="font-bold text-foreground font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {tool.stats}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab(tool.tab)}
                      className="w-full rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <span>{tool.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Secondary Utilities List */}
      <div className="space-y-3.5 pt-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Utilities & Performance Hub</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {secondaryTools.map((sec) => {
            const SecIcon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.tab)}
                className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all text-left flex items-start gap-3.5 group cursor-pointer shadow-xs"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 ${sec.color}`}
                >
                  <SecIcon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 leading-snug break-words">
                      {sec.title}
                    </h4>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                    {sec.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
