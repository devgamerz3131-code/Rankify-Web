import React from 'react';
export {
  Home,
  BookOpen,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  User,
  Search,
  Moon,
  Sun,
  Laptop,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Award,
  Flame,
  Clock,
  ArrowRight,
  Download,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  LogOut,
  LogIn,
  Settings,
  Shield,
  ShieldAlert,
  Layers,
  GraduationCap,
  BrainCircuit,
  Target,
  BarChart3,
  Bookmark,
  Compass,
  FileText,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export const RankifyLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-md shadow-purple-500/20 text-white ${className}`}
      style={{ width: size, height: size }}
      aria-label="Rankify Logo"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3/5 h-3/5"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    </div>
  );
};
