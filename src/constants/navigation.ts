import { Home, BookOpen, Target, TrendingUp, User, Sparkles, Video } from '@/icons';
import { NavItem } from '@/types/navigation';

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
  },
  {
    id: 'lecturelab',
    label: 'LectureLab',
    path: '/lecturelab',
    icon: Video,
    badge: 'Premium',
  },
  {
    id: 'study',
    label: 'Rankify Smart Engine',
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
    id: 'ai',
    label: 'Rankify AI',
    path: '/ai',
    icon: Sparkles,
    badge: 'Prompt Engine',
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
