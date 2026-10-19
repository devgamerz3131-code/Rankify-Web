import {
  Home,
  BookOpen,
  User,
  Sparkles,
  Settings,
  Shield,
  Bookmark,
  Brain,
  MoreHorizontal,
  TrendingUp,
} from '@/icons';
import { NavItem } from '@/types/navigation';

/**
 * The core permanent tabs for bottom navigation and primary desktop navigation
 */
export const PRIMARY_NAV_ITEMS: NavItem[] = [
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
    id: 'ai',
    label: 'AI Chat',
    path: '/ai',
    icon: Sparkles,
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
  },
  {
    id: 'more',
    label: 'More',
    path: '/more',
    icon: MoreHorizontal,
  },
];

/**
 * Secondary items nested inside the 'More' tab
 */
export const MORE_NAV_ITEMS: NavItem[] = [
  {
    id: 'ncert',
    label: 'NCERT',
    path: '/ncert',
    icon: BookOpen,
    badge: 'Reader',
  },
  {
    id: 'mistakes',
    label: 'Mistakes',
    path: '/mistakes',
    icon: Bookmark,
    badge: 'Notebook',
  },
  {
    id: 'weakness',
    label: 'Weakness',
    path: '/weakness',
    icon: Brain,
    badge: 'Analyzer',
  },
];

export const NAV_ITEMS: NavItem[] = [
  ...PRIMARY_NAV_ITEMS,
  ...MORE_NAV_ITEMS,
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
  {
    id: 'halfyearly',
    label: 'Half-Yearly Analyzer',
    path: '/halfyearly',
    icon: TrendingUp,
  },
  {
    id: 'admin',
    label: 'Admin Console',
    path: '/admin',
    icon: Shield,
  },
];

