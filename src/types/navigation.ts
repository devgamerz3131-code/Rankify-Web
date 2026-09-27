import { ComponentType } from 'react';

export type NavRoute = 'home' | 'lecturelab' | 'study' | 'practice' | 'progress' | 'profile' | 'ai';

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}
