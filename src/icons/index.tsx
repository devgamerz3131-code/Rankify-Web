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
  Brain,
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
  Video,
  History,
  RotateCcw,
  Zap,
  LayoutGrid,
  Grid,
  MoreHorizontal,
  Rocket,
} from 'lucide-react';

export const RankifyLogo: React.FC<{
  className?: string;
  size?: number;
  loading?: 'eager' | 'lazy';
}> = ({ className = '', size = 36, loading = 'eager' }) => {
  return (
    <img
      src="/logo-mark.png"
      alt="Rankify"
      width={size}
      height={size}
      loading={loading}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
