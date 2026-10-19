import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Atom,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  Target,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { getSavedStudentContext } from '../utils/student-context';
import { chatRepository } from '../repository/chat-repository';

interface EmptyStateProps {
  onSelectSuggestion: (promptText: string) => void;
  onSelectChat?: (chatId: string) => void;
}

const QUICK_ACTIONS = [
  {
    label: 'Explain Concept',
    prompt: 'Explain Electrochemistry core concepts step by step for CBSE Board exams',
    icon: BookOpen,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    label: 'Generate NCERT Qs',
    prompt: 'Generate top predicted 2, 3 and 5 mark NCERT board questions for Electric Charges and Fields',
    icon: HelpCircle,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    label: 'Solve Numerical',
    prompt: 'Solve essential numericals for Solutions chapter with step-by-step formula substitutions and SI units',
    icon: Calculator,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    label: 'Revision Plan',
    prompt: 'Create a 7-day high-yield CBSE board revision sprint plan for Class 12 Science',
    icon: Target,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
];

const SUGGESTIONS = [
  {
    subject: 'Chemistry',
    title: 'Explain Electrochemistry',
    desc: 'NCERT explanation, Nernst equation, board pattern & numericals',
    icon: Atom,
    prompt: 'Explain Electrochemistry in simple language with Nernst equation, cell EMF, and board numericals',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  {
    subject: 'Physics',
    title: 'Electric Charges and Fields',
    desc: "Gauss's law, dipole derivations, board PYQs & memory tricks",
    icon: Zap,
    prompt: "Explain Gauss's law applications and electric field derivations for CBSE Class 12 Physics",
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    subject: 'Mathematics',
    title: 'Master Integrals',
    desc: 'Integration by parts, substitution, board proofs & formulas',
    icon: Calculator,
    prompt: 'Provide master formula list and top board exam integration techniques for Class 12 Maths',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  {
    subject: 'Chemistry',
    title: 'Chemical Kinetics',
    desc: 'Rate laws, Arrhenius equation, order vs molecularity',
    icon: Atom,
    prompt: 'Explain rate constant, Arrhenius equation, and first order reaction numericals for Chemical Kinetics',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectSuggestion,
  onSelectChat,
}) => {
  const student = getSavedStudentContext();
  const studentName = student?.name ? student.name.split(' ')[0] : 'Student';
  const recentChats = chatRepository.getAllConversations().slice(0, 3);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-3xl mx-auto my-auto space-y-6">
      {/* Brand Hero Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 mb-4 border border-white/20">
          <Sparkles className="w-8 h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground text-center break-words max-w-full">
          Hello, {studentName}!
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 max-w-md font-medium text-center break-words px-2">
          Welcome to <strong className="text-purple-600 dark:text-purple-400">Rankify AI Workspace</strong>. Ask any Physics, Chemistry or Maths concept or start with a quick action below.
        </p>
      </motion.div>

      {/* Offline Architecture Badge */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted text-[11px] font-semibold text-foreground border border-border"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>CBSE Class 12 Science • Offline AI Engine • Zero API Latency</span>
      </motion.div>

      {/* Quick Action Launchers */}
      <div className="w-full space-y-2">
        <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block text-left px-1">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onSelectSuggestion(action.prompt)}
                className="p-3 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 border ${action.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Chats Section if present */}
      {recentChats.length > 0 && onSelectChat && (
        <div className="w-full space-y-2 text-left">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-500" />
              <span>Recent Study Chats</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => onSelectChat(chat.id)}
                className="p-2.5 rounded-xl bg-card border border-border hover:border-purple-500/40 text-left transition cursor-pointer flex items-center gap-2 group truncate"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {chat.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-sans">
                    {chat.messages.length} msgs • {chat.detectedSubject || 'CBSE'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Prompts Cards Grid */}
      <div className="w-full space-y-2 text-left">
        <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block px-1">
          Example Prompts
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {SUGGESTIONS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
                onClick={() => onSelectSuggestion(s.prompt)}
                className="p-3.5 rounded-2xl bg-card border border-border hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badgeColor}`}
                    >
                      {s.subject}
                    </span>
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                  </div>
                  <div className="font-bold text-xs text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {s.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                    {s.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Generate Prompt</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
