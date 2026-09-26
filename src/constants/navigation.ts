import { Home, BookOpen, Target, TrendingUp, User } from '@/icons';
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
