import { Home, BookOpen, Target, Sparkles, TrendingUp, User } from '@/icons';
import { NavItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
  },
  {
    id: 'study',
    label: 'Study',
    path: '/study',
    icon: BookOpen,
  },
  {
    id: 'practice',
    label: 'Practice',
    path: '/practice',
    icon: Target,
  },
  {
    id: 'ask-ai',
    label: 'Ask AI',
    path: '/ask-ai',
    icon: Sparkles,
    badge: 'AI',
    isAi: true,
  },
  {
    id: 'progress',
    label: 'Progress',
    path: '/progress',
    icon: TrendingUp,
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
  },
];
