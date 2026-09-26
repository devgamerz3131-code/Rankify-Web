import { ComponentType } from 'react';

export type NavRoute = 'home' | 'study' | 'practice' | 'progress' | 'profile';

export interface NavItem {
  id: NavRoute;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}
